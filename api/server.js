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

const { getIntent } = require("../modules/intent/intentRecognizer");
const { loadNLPModel, saveNLPModel } = require("../modules/nlp/nlpModel");
const { generateResponse } = require("../modules/nlp/transformer");
const { logConversation } = require("../modules/logging/logger");

const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Usa "/tmp/logs" in produzione, altrimenti "../logs"
const logDir = process.env.NODE_ENV === "development" ? "/tmp/logs" : path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configurazione del logger con Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, "server.log") }),
  ],
});

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
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {},
  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 30000)),
});

redis.on("connect", () => logger.info("✅ Connected to Redis successfully!"));
redis.on("error", (err) => logger.error(`❌ Redis connection error: ${err.message}`));
redis.on("end", () => {
  logger.warn("⚠️ Redis connection closed. Reconnecting...");
  setTimeout(() => redis.connect(), 5000);
});

// ✅ Connessione a MongoDB con gestione della riconnessione
const connectMongoDB = async () => {
  logger.info(`🔹 MONGO_URI: ${process.env.MONGO_URI}`); // <-- Aggiunto qui per il debug
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Aspetta max 10 sec per il server
      socketTimeoutMS: 60000, // Timeout di 60 sec per le operazioni
    });
    logger.info("📚 Connected to MongoDB");
  } catch (err) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
  }
};
connectMongoDB();

mongoose.connection.on("error", (err) => logger.error(`❌ Mongoose connection error: ${err.message}`));
mongoose.connection.on("disconnected", connectMongoDB);

// ✅ Health Check
router.get("/health", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    const redisStatus = await redis.ping().then((res) => (res === "PONG" ? "Connected" : "Disconnected"));
    res.json({ status: "✅ Healthy", mongo: mongoStatus, redis: redisStatus });
  } catch (error) {
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
    const { question, userId } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });
    const storedAnswer = await Question.findOne({ question });
    if (storedAnswer) return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });
    const intentResult = await manager.process("en", question);
    const finalAnswer = intentResult.answer || "I'm not sure how to answer that yet.";
    await new Question({ question, answer: finalAnswer, source: "Ultron AI" }).save();
    res.json({ answer: finalAnswer, source: "Ultron AI" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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

if (require.main === module) {
  app.listen(8889, () => logger.info("Server running on port 8889"));
}

module.exports = { app, handler: serverless(app) };
