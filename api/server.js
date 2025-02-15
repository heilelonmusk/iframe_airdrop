require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const timeout = require("connect-timeout");
const { NlpManager } = require("node-nlp");
const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Usa "/tmp/logs" in produzione, altrimenti "../logs"
const logDir = (process.env.NODE_ENV === "production")
  ? "/tmp/logs"
  : path.join(__dirname, "../logs");

// Log di debug (opzionale)
// console.log("NODE_ENV =", process.env.NODE_ENV);
// console.log("logDir =", logDir);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ✅ Import necessary modules
const { initializeNLP, getIntent } = require("../modules/intent/intentRecognizer");
const { loadNLPModel, saveNLPModel } = require("../modules/nlp/nlpModel");
const { generateResponse } = require("../modules/nlp/transformer");
const { logConversation } = require("../modules/logging/logger");

const app = express();
const router = express.Router();
const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// ✅ Winston Logger Configuration
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

// ✅ CORS e middleware
app.use(cors({ origin: "https://helon.space", credentials: true }));
app.use(express.json());
app.use(timeout("10s")); // Previene richieste troppo lunghe

// ✅ Rate Limiting
app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1-minute window
    max: 10, // Max 10 requests per minute
    message: "Too many requests. Please try again later.",
    keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown-ip",
  })
);

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  logger.error("❌ ERROR: MONGO_URI is missing! API will not function.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
  .then(() => {
    logger.info("📚 Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Schema & Model for Knowledge Base
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

// ✅ Schema for Storing NLP Model in MongoDB
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true },
});
const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// ✅ Initialize NLP Model
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

// ✅ Train NLP Model & Save to MongoDB
async function trainAndSaveNLP() {
  manager.addDocument("en", "hello", "greeting");
  manager.addDocument("en", "hi there", "greeting");
  manager.addDocument("en", "goodbye", "farewell");
  manager.addDocument("en", "bye", "farewell");
  manager.addDocument("en", "where can I find official channels?", "channels");
  manager.addDocument("en", "how can I contact Helon?", "channels");
  manager.addDocument("en", "help", "help");
  manager.addDocument("en", "what can you do?", "help");

  await manager.train();
  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  logger.info("✅ New NLP Model trained and saved!");
}

// ✅ API Endpoint: Handle User Questions
router.post("/logQuestion", async (req, res) => {
  try {
    const { question, userId } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    logger.info(`📩 Received question: "${question}"`);

    const anonymousUser = userId || "anonymous";

    // Step 1: Check if answer exists in DB
    let storedAnswer = await Question.findOne({ question });

    if (storedAnswer) {
      logger.info(`✅ Found answer in DB: ${JSON.stringify(storedAnswer.answer)}`);

      let safeAnswer = storedAnswer.answer || "No answer found.";
      let safeSource = storedAnswer.source || "Ultron AI";

      if (typeof storedAnswer.answer === "object" && storedAnswer.answer !== null) {
        safeAnswer = storedAnswer.answer.answer || JSON.stringify(storedAnswer.answer);
        safeSource = storedAnswer.answer.source || storedAnswer.source || "Ultron AI";
      }

      return res.json({
        answer: typeof safeAnswer === "string" ? safeAnswer : JSON.stringify(safeAnswer),
        source: safeSource,
      });
    }

    // Step 2: Process request with NLP
    const intentResult = await manager.process("en", question);
    let finalAnswer =
      intentResult.answer || (await generateResponse(question)) || "I'm not sure how to answer that yet.";

    // Log conversation
    await logConversation({
      userId: anonymousUser,
      question,
      answer: typeof finalAnswer === "string" ? finalAnswer : JSON.stringify(finalAnswer),
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date(),
    });

    // Save answer for future use
    const newEntry = new Question({
      question,
      answer: typeof finalAnswer === "string" ? finalAnswer : { answer: finalAnswer, source: "Ultron AI" },
      source: "Ultron AI",
    });

    await newEntry.save();

    res.json({
      answer: typeof finalAnswer === "string" ? finalAnswer : JSON.stringify(finalAnswer),
      source: "Ultron AI",
    });
  } catch (error) {
    logger.error("❌ Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Health Check Endpoint con debug migliorato
router.get("/health", async (req, res) => {
  try {
    // Verifica se la connessione a MongoDB è pronta
    if (mongoose.connection.readyState !== 1) {
      logger.error("❌ MongoDB is not connected. readyState =", mongoose.connection.readyState);
      return res.status(500).json({ error: "MongoDB not connected" });
    }
    const admin = mongoose.connection.db.admin();
    const pingResult = await admin.ping();
    logger.info("✅ Health check ping result: " + JSON.stringify(pingResult));
    res.json({ status: "✅ Healthy", mongo: "Connected" });
  } catch (error) {
    logger.error("❌ Health check failed:", error.message);
    res.status(500).json({ error: "Service is unhealthy" });
  }
});

// NEW ENDPOINT: /fetch
router.get("/fetch", async (req, res) => {
  const { source, file, query } = req.query;
  if (source === "github") {
    try {
      // Simulazione: recupera contenuto da GitHub (sostituisci con la logica reale)
      const fileContent = `Contenuto simulato da GitHub per il file ${file}`;
      return res.json({ data: fileContent });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (source === "mongodb") {
    try {
      // Simulazione: esegui una query in MongoDB (sostituisci con la logica reale)
      const result = { key: query, value: "Dati simulati da MongoDB" };
      return res.json({ data: result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(400).json({ error: "Source non riconosciuto" });
  }
});

// NEW ENDPOINT: /store
router.post("/store", async (req, res) => {
  try {
    const { key, value } = req.body;
    // Simulazione: salva dati (sostituisci con la logica reale per salvare in MongoDB)
    return res.json({ message: "Dati salvati correttamente" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// NEW ENDPOINT: /download
router.get("/download", async (req, res) => {
  const { source, file } = req.query;
  if (source === "github") {
    try {
      // Simulazione: recupera contenuto da GitHub (sostituisci con la logica reale)
      const fileData = `Contenuto simulato del file ${file}`;
      res.setHeader("Content-Disposition", `attachment; filename=${file}`);
      return res.send(fileData);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(404).json({ error: "File non trovato" });
  }
});

app.use("/.netlify/functions/server", router);

if (require.main === module) {
  const port = process.env.PORT || 8888;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

module.exports = { app, handler: serverless(app) };