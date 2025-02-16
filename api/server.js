require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const timeout = require("connect-timeout");
const { NlpManager } = require("node-nlp");
const winston = require("winston");
const Redis = require("ioredis");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 8889;

// Import dei moduli
const { getIntent } = require("../modules/intent/intentRecognizer");
const { loadNLPModel, saveNLPModel } = require("../modules/nlp/nlpModel");
const { generateResponse } = require("../modules/nlp/transformer");
const { logConversation } = require("../modules/logging/logger");

// Inizializza il manager NLP
const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Configurazione del logger con Winston
const logDir = process.env.NODE_ENV === "development" ? "/tmp/logs" : path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, "server.log"),
      maxsize: 1024 * 1024 * 5, // Max 5MB
      maxFiles: 3,
      tailable: true
    }),
  ],
});

// Crea l'app Express e il router
const app = express();
const router = express.Router();

// Middleware
app.set("trust proxy", true);
app.use(cors({ origin: "https://helon.space", credentials: true }));
app.use(express.json());
app.use(timeout("10s"));

// Rate Limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many requests. Please try again later.",
    keyGenerator: (req) => req.ip,
  })
);

// ✅ Connessione a Redis
console.log("🔹 REDIS_HOST:", process.env.REDIS_HOST);
console.log("🔹 REDIS_PORT:", process.env.REDIS_PORT);
console.log("🔹 REDIS_PASSWORD:", process.env.REDIS_PASSWORD ? "********" : "Not Set");
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {},
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error("❌ Too many Redis reconnection attempts. Stopping...");
      return null;
    }
    return Math.min(times * 1000, 30000);
  }
});

redis.on("connect", () => logger.info("✅ Connected to Redis successfully!"));
redis.on("error", (err) => logger.error(`❌ Redis connection error: ${err.message}`));
redis.on("end", () => {
  logger.warn("⚠️ Redis connection closed. Reconnecting...");
  setTimeout(() => redis.connect(), 5000);
});

// ✅ Funzione per connettersi a MongoDB
const connectMongoDB = async () => {
  // Controlla lo stato della connessione: 1 significa "connesso"
  if (mongoose.connection.readyState === 1) {
    logger.info("🔄 MongoDB already connected, reusing existing connection.");
    return mongoose.connection;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000
    });
    logger.info("📚 Connected to MongoDB");
  } catch (err) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
  }
  return mongoose.connection;
};

// ✅ Connessione iniziale
connectMongoDB();

setInterval(async () => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn("⚠️ MongoDB disconnected. Reconnecting...");
    await connectMongoDB();
  }
}, 30000);  // Controllo ogni 30 secondi

mongoose.connection.on("disconnected", async () => {
  logger.warn("⚠️ MongoDB disconnected. Trying to reconnect...");
  setTimeout(connectMongoDB, 5000);  // Prova a riconnetterti dopo 5 secondi
});

mongoose.connection.on("error", (err) => {
  logger.error(`❌ Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("close", () => {
  logger.warn("⚠️ MongoDB connection closed!");
});

mongoose.connection.on("reconnected", () => {
  logger.info("✅ MongoDB reconnected!");
});

// ✅ Health Check
router.get("/health", async (req, res) => {
  try {
    logger.info("🔹 Health check started...");

    // Se la connessione non è attiva, tentiamo di riconnetterci
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⚠️ MongoDB not connected, attempting to reconnect...");
      await connectMongoDB();
    }

    let mongoStatus = "Disconnected";
    try {
      if (mongoose.connection.readyState === 1) {
        const admin = mongoose.connection.db.admin();
        await admin.ping();
        mongoStatus = "Connected";
      }
    } catch (e) {
      mongoStatus = "Disconnected";
    }
    logger.info(`🔹 MongoDB Status: ${mongoStatus}`);

    let redisStatus = "Disconnected";
    if (redis.status === "ready") {
      redisStatus = await redis
        .ping()
        .then((res) => (res === "PONG" ? "Connected" : "Disconnected"))
        .catch(() => "Disconnected");
    }

    res.json({ status: "✅ Healthy", mongo: mongoStatus, redis: redisStatus });
  } catch (error) {
    logger.error(`❌ Health check failed: ${error.message}`);
    res.status(500).json({ error: "Service is unhealthy", details: error.message });
  }
});

app.use("/.netlify/functions/server", router);

// Schema & Model per Knowledge Base
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

// Schema per NLP Model
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true },
});
const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// Inizializza il modello NLP
(async () => {
  try {
    const savedModel = await loadNLPModel();
    if (savedModel) {
      manager.import(savedModel);
      logger.info("🧠 NLP Model Loaded from DB");
    } else {
      await trainAndSaveNLP();
    }
  } catch (error) {
    logger.error("❌ Error initializing NLP model:", error);
  }
})();

// Funzione per allenare e salvare il modello NLP
async function trainAndSaveNLP() {
  manager.addDocument("en", "hello", "greeting");
  await manager.train();
  await saveNLPModel(manager.export());
  logger.info("✅ New NLP Model trained and saved!");
}

// Endpoint per gestire le domande degli utenti
router.post("/logQuestion", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    const storedAnswer = await Question.findOne({ question });
    if (storedAnswer) return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });

    const intentResult = await manager.process("en", question);
    if (!intentResult.answer) {
      return res.status(404).json({ error: "No answer available for this question." });
    }

    const finalAnswer = intentResult.answer;
    await new Question({ question, answer: finalAnswer, source: "Ultron AI" }).save();
    res.json({ answer: finalAnswer, source: "Ultron AI" });
  } catch (error) {
    logger.error(`❌ Error processing question: ${error.message}`);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ Nuovi endpoint: /fetch, /store, /download
router.get("/fetch", async (req, res) => {
  const { source, file, query } = req.query;
  if (source === "github") {
    return res.json({ data: `Simulated content from GitHub for ${file}` });
  } else if (source === "mongodb") {
    return res.json({ data: { key: query, value: "Simulated MongoDB data" } });
  } else {
    return res.status(400).json({ error: "Unrecognized source" });
  }
});

// Avvio del server (solo se eseguito come modulo principale e non in ambiente serverless)
if (require.main === module && !process.env.NETLIFY) {
  app.listen(port, () => logger.info(`Server running on port ${port}`));
}

module.exports = app;
module.exports.handler = serverless(app);