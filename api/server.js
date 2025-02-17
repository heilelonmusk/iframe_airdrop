require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const timeout = require("connect-timeout");
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });
const { trainAndSaveNLP, loadNLPModel, saveNLPModel, NLPModel , nlprocessText } = require("../modules/nlp/nlpModel");
//const winston = require("winston");
const { redis, quitRedis, cacheMiddleware } = require("../config/redis");
const fs = require("fs");
const path = require("path");
const { logger } = require("../modules/logging/logger");
//logger.error("This is an error message");
logger.info("🔍 Using MONGO_URI:", process.env.MONGO_URI);
// Import dei moduli
//const { getIntent } = require("../modules/intent/intentRecognizer");
//const { generateResponse } = require("../modules/nlp/transformer");
//const { logConversation } = require("../modules/logging/logger");
if (!process.env.NETLIFY) console.log(`🚀 Server running on port ${port}`);

// Inizializza il manager NLP
//const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Configurazione del logger con Winston
//const logDir = process.env.NODE_ENV === "development" ? "/tmp/logs" : path.join(__dirname, "../logs");
//if (!fs.existsSync(logDir)) {
//  fs.mkdirSync(logDir, { recursive: true });
//}
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
//  ),
//  transports: [
//    new winston.transports.Console(),
//    new winston.transports.File({
//      filename: path.join(logDir, "server.log"),
//      maxsize: 1024 * 1024 * 5, // Max 5MB
//      maxFiles: 3,
//      tailable: true
//    }),
//  ],
// });

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
//console.log("🔹 REDIS_HOST:", process.env.REDIS_HOST);
//console.log("🔹 REDIS_PORT:", process.env.REDIS_PORT);
//console.log("🔹 REDIS_PASSWORD:", process.env.REDIS_PASSWORD ? "********" : "Not Set");
//const redis = new Redis({
//  host: process.env.REDIS_HOST,
//  port: process.env.REDIS_PORT,
//  password: process.env.REDIS_PASSWORD,
//  tls: {},
//  retryStrategy: (times) => {
//    if (times > 10) {
//      logger.error("❌ Too many Redis reconnection attempts. Stopping...");
//      return null;
//    }
//   return Math.min(times * 1000, 30000);
//  }
// });

//redis.on("connect", () => logger.info("✅ Connected to Redis successfully!"));
//redis.on("error", (err) => logger.error(`❌ Redis connection error: ${err.message}`));
//redis.on("end", () => {
//  logger.warn("⚠️ Redis connection closed. Reconnecting...");
//  setTimeout(() => redis.connect(), 5000);
//});

const mongoURI = process.env.MONGO_URI;

if (!mongoURI || !mongoURI.startsWith("mongodb")) {
  logger.error("❌ MONGO_URI non valido o non definito. Controlla le variabili d'ambiente.");
  process.exit(1); // Interrompe l'app se MONGO_URI è errato
}

// Avvia il server solo se non è in ambiente serverless
if (!process.env.NETLIFY) {
  const server = app.listen(port, () => {
    logger.info(`🚀 Server running on port ${server.address().port}`);
});

// Connessione MongoDB con retry
const { connectMongoDB } = async () => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    if (mongoose.connection.readyState === 1) {
      logger.info("🔄 MongoDB already connected.");
      return;
    }

    try {
      await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
      logger.info("📚 Connected to MongoDB successfully!");
      return;
    } catch (err) {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    }

    attempts++;
    logger.warn(`🔁 Retrying in ${RETRY_DELAY / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
  }

  logger.error("🚨 Max retries reached. MongoDB connection failed.");
  throw new Error("MongoDB connection failed.");
};

app.use(async (req, res, next) => {
  try {
    // ✅ Verifica che MongoDB sia connesso
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⚠️ MongoDB not connected, attempting to reconnect...");
      await connectMongoDB();
    }

    // ✅ Se il modello NLP non è in cache, lo carica dal database
    if (!global.nlpModelCache) {
      logger.info("🔄 Loading NLP Model from database...");
      const modelData = await loadNLPModel();

      if (modelData) {
        const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });
        manager.import(modelData); // Importa i dati del modello
        global.nlpModelCache = manager;
        logger.info("✅ NLP Model loaded into global cache.");
      } else {
        logger.warn("⚠️ No NLP Model found in database, training a new one...");
        await trainAndSaveNLP();
        global.nlpModelCache = await loadNLPModel();
      }
    }

    // ✅ Se ancora non esiste, ritorna un errore
    if (!global.nlpModelCache) {
      logger.error("❌ No NLP Model found in database. Train the model first.");
      return res.status(500).json({ error: "❌ No NLP Model found in database. Train the model first." });
    }

    req.nlpInstance = global.nlpModelCache;
    next();
  } catch (error) {
    logger.error("❌ Error loading NLP Model:", error.message);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Endpoint /health aggiornato con log dettagliati (il resto rimane invariato)
router.get("/health", async (req, res) => {
  let mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectMongoDB();
      mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    }
  } catch (error) {
    logger.error("MongoDB health check failed:", error.message);
  }

  res.json({ status: "✅ Healthy", mongo: mongoStatus });
});

app.use("/.netlify/functions/server", router);

const port = process.env.PORT || 3000; // Imposta un valore di default
console.log(`🚀 Server running on port ${port}`);

if (!process.env.NETLIFY) {
  const server = app.listen(port, () => {
    logger.info(`🚀 Server running on port ${server.address().port}`);
  });
  
  // Gestione della chiusura
  process.on("SIGTERM", () => {
    logger.warn("⚠️ SIGTERM received. Closing server...");
    server.close(() => {
      logger.info("✅ Server closed.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.warn("⚠️ SIGINT received. Closing server...");
    server.close(() => {
      logger.info("✅ Server closed.");
      process.exit(0);
    });
  });
}

  // Gestione della chiusura per evitare porte bloccate
  process.on("SIGTERM", () => {
    logger.warn("⚠️ SIGTERM received. Closing server...");
    server.close(() => {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.warn("⚠️ SIGINT received (CTRL+C). Closing server...");
    server.close(() => {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });
}

// Schema & Model per Knowledge Base
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

// Schema per NLP Model
//const NLPModelSchema = new mongoose.Schema({
//  modelData: { type: Object, required: true },
//});
//const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// Funzione per allenare e salvare il modello NLP
//async function trainAndSaveNLP() {
//  manager.addDocument("en", "hello", "greeting");
//  await manager.train();
//  await saveNLPModel(manager.export());
//  logger.info("✅ New NLP Model trained and saved!");
//}

// Inizializza il modello NLP
(async () => {
  try {
    // Attende esplicitamente che la connessione sia attiva
    await connectMongoDB();

    // Ora è sicuro eseguire le operazioni sul database
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

// Endpoint per NLP
router.post("/api/nlp", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    return res.json({ answer: response });
  } catch (error) {
    logger.error(`❌ Error processing NLP request: ${error.message}`);
    return res.status(500).json({ error: "Server error", details: error.message });
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
  
  // Aggiungere gestione della chiusura per liberare la porta
  process.on("SIGINT", () => {
    logger.warn("⚠️ SIGINT received (CTRL+C). Closing server...");
    server.close(() => {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });
  
  process.on("SIGTERM", () => {
    logger.warn("⚠️ SIGTERM received. Closing server...");
    server.close(() => {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });

module.exports = { app, handler: serverless(app), redis, connectMongoDB };