require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const timeout = require("connect-timeout");
const { NlpManager } = require("node-nlp");
const { trainAndSaveNLP, loadNLPModel, saveNLPModel } = require("../modules/nlp/nlpModel");
const { redis, quitRedis, cacheMiddleware } = require("../config/redis");
const { logger } = require("../modules/logging/logger");

const app = express();
const router = express.Router();

// ✅ Middleware
app.set("trust proxy", true);
app.use(cors({ origin: "https://helon.space", credentials: true }));
app.use(express.json());
app.use(timeout("10s"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many requests. Please try again later.",
    keyGenerator: (req) => req.ip,
  })
);

const mongoURI = process.env.MONGO_URI;
if (!mongoURI || !mongoURI.startsWith("mongodb")) {
  logger.error("❌ MONGO_URI non valido o non definito.");
  process.exit(1);
}

// ✅ Connessione MongoDB con retry
const connectMongoDB = async () => {
  let attempts = 0;
  while (attempts < 5) {
    if (mongoose.connection.readyState === 1) return;
    try {
      await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
      logger.info("📚 Connected to MongoDB successfully!");
      return;
    } catch (err) {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("MongoDB connection failed.");
};

// ✅ Inizializzazione NLP Model
(async () => {
  try {
    await connectMongoDB();
    const savedModel = await loadNLPModel();
    global.nlpModelCache = savedModel ? new NlpManager({ languages: ["en"], forceNER: true }).import(savedModel) : await trainAndSaveNLP();
  } catch (error) {
    logger.error("❌ Error initializing NLP model:", error);
  }
})();

// ✅ Endpoint /health
router.get("/health", async (req, res) => {
  let mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  try {
    if (mongoStatus === "Disconnected") {
      await connectMongoDB();
      mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    }
  } catch (error) {
    logger.error("MongoDB health check failed:", error.message);
  }
  res.json({ status: "✅ Healthy", mongo: mongoStatus });
});

// ✅ Gestione NLP
router.post("/api/nlp", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });
    const response = await global.nlpModelCache.process("en", question);
    res.json({ answer: response.answer || "I'm not sure how to answer that yet." });
  } catch (error) {
    logger.error(`❌ Error processing NLP request: ${error.message}`);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ Knowledge Base Schema & Model
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

// ✅ Log Question & AI Response
router.post("/logQuestion", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    let storedAnswer = await Question.findOne({ question });
    if (storedAnswer) return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });

    const intentResult = await global.nlpModelCache.process("en", question);
    if (!intentResult.answer) return res.status(404).json({ error: "No answer available for this question." });

    storedAnswer = await new Question({ question, answer: intentResult.answer, source: "Ultron AI" }).save();
    res.json({ answer: storedAnswer.answer, source: storedAnswer.source });
  } catch (error) {
    logger.error(`❌ Error processing question: ${error.message}`);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ Nuovi endpoint: /fetch, /store, /download
router.get("/fetch", async (req, res) => {
  try {
    const { source, file, query } = req.query;
    if (source === "github") {
      return res.json({ data: `Simulated content from GitHub for ${file}` });
    } else if (source === "mongodb") {
      return res.json({ data: { key: query, value: "Simulated MongoDB data" } });
    } else {
      return res.status(400).json({ error: "Unrecognized source" });
    }
  } catch (error) {
    logger.error(`❌ Error in /fetch: ${error.message}`);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ Chiusura sicura del server e Redis
const gracefulShutdown = () => {
  logger.warn("⚠️ Server shutting down...");
  if (server) {
    server.close(() => {
      logger.info("✅ Server closed.");
      quitRedis();
      process.exit(0);
    });
  } else {
    quitRedis();
    process.exit(0);
  }
};
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

app.use("/.netlify/functions/server", router);
const port = process.env.PORT || 3000;
let server;
if (!process.env.NETLIFY) {
  server = app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`);
  });
}

module.exports = { app, handler: serverless(app), redis, connectMongoDB };