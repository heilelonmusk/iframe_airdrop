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

logger.info(`NODE_ENV = ${process.env.NODE_ENV}`);
logger.info(`Log directory: ${logDir}`);

const { initializeNLP, getIntent } = require("../modules/intent/intentRecognizer");
const { loadNLPModel, saveNLPModel } = require("../modules/nlp/nlpModel");
const { generateResponse } = require("../modules/nlp/transformer");
const { logConversation } = require("../modules/logging/logger");

const app = express();
const router = express.Router();
const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Middleware
app.use(cors({ origin: "https://helon.space", credentials: true }));
app.use(express.json());
app.use(timeout("10s"));

// Rate Limiting
app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10,
    message: "Too many requests. Please try again later.",
    keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown-ip",
  })
);

// ✅ Connessione a MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  logger.error("❌ ERROR: MONGO_URI is missing! API will not function.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info("📚 Connected to MongoDB");
    logger.info(`Mongoose readyState: ${mongoose.connection.readyState}`);
  } catch (err) {
    logger.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

// Ascolta eventuali errori nella connessione
mongoose.connection.on("error", (err) => {
  logger.error("❌ Mongoose connection error:", err.message);
});

// ✅ Connessione a Redis
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
  logger.error("❌ ERROR: Redis environment variables are missing!");
  process.exit(1);
}

logger.info(`🔹 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  tls: {}, // ✅ NECESSARIO per Upstash Redis
});

redis.on("connect", () => {
  logger.info("✅ Connected to Redis successfully!");
});

redis.on("error", (err) => {
  logger.error(`❌ Redis connection error: ${err.message}`);
});

redis.on("reconnecting", () => {
  logger.warn("⚠️ Redis is reconnecting...");
});

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
    if (savedModel && Object.keys(savedModel).length > 0) {
      manager.import(savedModel);
      logger.info("🧠 NLP Model Loaded from DB");
    } else {
      logger.info("🚀 Training new NLP Model...");
      await trainAndSaveNLP();
    }
  } catch (error) {
    logger.error("❌ Error initializing NLP model:", error);
  }
})();

// Funzione per allenare e salvare il modello NLP
async function trainAndSaveNLP() {
  manager.addDocument("en", "hello", "greeting");
  manager.addDocument("en", "hi there", "greeting");
  manager.addDocument("en", "goodbye", "farewell");

  await manager.train();
  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  logger.info("✅ New NLP Model trained and saved!");
}

// Endpoint per gestire le domande degli utenti
router.post("/logQuestion", async (req, res) => {
  try {
    const { question, userId } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    logger.info(`📩 Received question: "${question}"`);
    const anonymousUser = userId || "anonymous";

    let storedAnswer = await Question.findOne({ question });
    if (storedAnswer) {
      return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });
    }

    const intentResult = await manager.process("en", question);
    let finalAnswer =
      intentResult.answer || (await generateResponse(question)) || "I'm not sure how to answer that yet.";

    await logConversation({
      userId: anonymousUser,
      question,
      answer: finalAnswer,
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date(),
    });

    const newEntry = new Question({ question, answer: finalAnswer, source: "Ultron AI" });
    await newEntry.save();

    res.json({ answer: finalAnswer, source: "Ultron AI" });
  } catch (error) {
    logger.error("❌ Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Health Check
router.get("/health", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    await redis.ping();
    res.json({ status: "✅ Healthy", mongo: "Connected", redis: "Connected" });
  } catch (error) {
    logger.error("❌ Health check failed:", error.message);
    res.status(500).json({ error: "Service is unhealthy" });
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

app.use("/.netlify/functions/server", router);

// In modalità sviluppo, avvia il server in locale
if (require.main === module) {
  const port = process.env.PORT || 8888;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

module.exports = { app, handler: serverless(app) };