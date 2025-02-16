require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const timeout = require("connect-timeout");
const { loadNLPModel, saveNLPModel, NLPModel } = require("../modules/nlp/nlpModel");
//const winston = require("winston");
const redis = require("../config/redis");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 8889;
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");
//logger.error("This is an error message");

// Import dei moduli
const { getIntent } = require("../modules/intent/intentRecognizer");
const { generateResponse } = require("../modules/nlp/transformer");
//const { logConversation } = require("../modules/logging/logger");

// Inizializza il manager NLP
//const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Configurazione del logger con Winston
const logDir = process.env.NODE_ENV === "development" ? "/tmp/logs" : path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
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

// Funzione per connettersi a MongoDB con gestione forzata se rimane in stato "connecting"
const connectMongoDB = async () => {
  // Se già connesso (stato 1), restituisci la connessione attiva
  if (mongoose.connection.readyState === 1) {
    logger.info("🔄 MongoDB already connected, reusing existing connection.");
    return mongoose.connection;
  }
  
  // Se rimane in "connecting" (stato 2), forziamo la disconnessione e attendiamo che lo stato diventi 0 (disconnesso)
if (mongoose.connection.readyState === 2) {
  logger.warn("Mongoose connection is stuck in 'connecting' state. Forcing disconnect...");
  try {
    await mongoose.disconnect();
    // Attende finché lo stato non diventa 0, con un timeout massimo di 5000ms
    await new Promise((resolve, reject) => {
      const start = Date.now();
      const checkState = () => {
        if (mongoose.connection.readyState === 0) {
          resolve();
        } else if (Date.now() - start > 5000) {
          reject(new Error("Timeout waiting for mongoose to disconnect."));
        } else {
          setTimeout(checkState, 500); // Ritardo aumentato a 500ms
        }
      };
      checkState();
    });
    logger.info("Forced disconnect successful. ReadyState is now: " + mongoose.connection.readyState);
  } catch (err) {
    logger.error("Error during forced disconnect: " + err.message);
  }
}
  
  // Ora tenta di connettersi
try {
  await mongoose.connect(process.env.MONGO_URI, {
    // Le opzioni deprecate possono essere omesse con il driver 4.x
  });
  logger.info("📚 Connected to MongoDB");

  // Aggiungi i listener di connessione
  mongoose.connection.on("error", (err) => logger.error("MongoDB error:", err));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected."));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected!"));
} catch (err) {
  logger.error(`❌ MongoDB connection error: ${err.message}`);
}

// Attende un po' per permettere l'aggiornamento dello stato
await new Promise((resolve) => setTimeout(resolve, 1000));
logger.info("Final mongoose.connection.readyState: " + mongoose.connection.readyState);
return mongoose.connection;
};

// Endpoint /health aggiornato con log dettagliati (il resto rimane invariato)
router.get("/health", async (req, res) => {
  try {
    logger.info("🔹 Health check started...");

    // Log dello stato iniziale della connessione
    let currentState = mongoose.connection.readyState;
    logger.info(`Current mongoose.connection.readyState: ${currentState}`);
    
    // Se non è 1, tentiamo la riconnessione
    if (currentState !== 1) {
      logger.warn(`⚠️ MongoDB not connected (state ${currentState}), attempting to reconnect...`);
      await connectMongoDB();
      currentState = mongoose.connection.readyState;
      logger.info(`After reconnect attempt, mongoose.connection.readyState: ${currentState}`);
    }

    let mongoStatus = "Disconnected";
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        logger.info("Performing MongoDB ping command...");
        const pingResult = await mongoose.connection.db.command({ ping: 1 });
        logger.info("MongoDB ping result: " + JSON.stringify(pingResult));
        if (pingResult && pingResult.ok === 1) {
          mongoStatus = "Connected";
        } else {
          logger.warn("MongoDB ping did not return an ok result");
        }
      } else {
        logger.warn("mongoose.connection.readyState is not 1 or mongoose.connection.db is not available");
      }
    } catch (pingError) {
      logger.error("MongoDB ping error: " + pingError.message);
      mongoStatus = "Disconnected";
    }
    logger.info(`🔹 MongoDB Status: ${mongoStatus}`);

    let redisStatus = "Disconnected";
    try {
      if (redis.status === "ready") {
        logger.info("Performing Redis ping...");
        const redisPing = await redis.ping();
        logger.info("Redis ping result: " + redisPing);
        redisStatus = redisPing === "PONG" ? "Connected" : "Disconnected";
      } else {
        logger.warn(`Redis status not ready: ${redis.status}`);
      }
    } catch (redisError) {
      logger.error("Redis ping error: " + redisError.message);
      redisStatus = "Disconnected";
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
//const NLPModelSchema = new mongoose.Schema({
//  modelData: { type: Object, required: true },
//});
//const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// Inizializza il modello NLP (aggiornato per attendere la connessione a MongoDB)
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

module.exports = { app, handler: serverless(app), redis };