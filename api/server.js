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
const logDir = (process.env.NODE_ENV === "production") ? "/tmp/logs" : path.join(__dirname, "../logs");

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

// ✅ MongoDB Connection
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

// Endpoint per gestire le domande degli utenti
router.post("/logQuestion", async (req, res) => {
  try {
    const { question, userId } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    logger.info(`📩 Received question: "${question}"`);
    const anonymousUser = userId || "anonymous";

    // Cerca la risposta nel DB
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

    // Processa la richiesta con NLP
    const intentResult = await manager.process("en", question);
    let finalAnswer =
      intentResult.answer || (await generateResponse(question)) || "I'm not sure how to answer that yet.";

    // Log della conversazione
    await logConversation({
      userId: anonymousUser,
      question,
      answer: typeof finalAnswer === "string" ? finalAnswer : JSON.stringify(finalAnswer),
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date(),
    });

    // Salva la nuova risposta nel DB
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

// Endpoint Health Check con maggiori log
router.get("/health", async (req, res) => {
  try {
    // Verifica lo stato della connessione a MongoDB
    if (mongoose.connection.readyState !== 1) {
      logger.error(`❌ Health check: MongoDB not connected (readyState: ${mongoose.connection.readyState})`);
      return res.status(500).json({ error: "Service is unhealthy", mongoReadyState: mongoose.connection.readyState });
    }

    // Esegue un ping sul database
    const admin = mongoose.connection.db.admin();
    const pingResult = await admin.ping();
    logger.info("Ping result: " + JSON.stringify(pingResult));

    res.json({ status: "✅ Healthy", mongo: "Connected" });
  } catch (error) {
    logger.error("❌ Health check failed:", error.message);
    res.status(500).json({ error: "Service is unhealthy" });
  }
});

// Nuovi endpoint: /fetch, /store, /download
router.get("/fetch", async (req, res) => {
  const { source, file, query } = req.query;
  if (source === "github") {
    try {
      const fileContent = `Contenuto simulato da GitHub per il file ${file}`;
      return res.json({ data: fileContent });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (source === "mongodb") {
    try {
      const result = { key: query, value: "Dati simulati da MongoDB" };
      return res.json({ data: result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(400).json({ error: "Source non riconosciuto" });
  }
});

router.post("/store", async (req, res) => {
  try {
    const { key, value } = req.body;
    return res.json({ message: "Dati salvati correttamente" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/download", async (req, res) => {
  const { source, file } = req.query;
  if (source === "github") {
    try {
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

// In modalità sviluppo, avvia il server in locale
if (require.main === module) {
  const port = process.env.PORT || 8888;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

module.exports = { app, handler: serverless(app) };