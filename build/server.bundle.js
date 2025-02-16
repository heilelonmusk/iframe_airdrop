/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./api/server.js":
/*!***********************!*\
  !*** ./api/server.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
(__webpack_require__(/*! dotenv */ "dotenv").config)();
const express = __webpack_require__(/*! express */ "express");
const mongoose = __webpack_require__(/*! mongoose */ "mongoose");
const serverless = __webpack_require__(/*! serverless-http */ "serverless-http");
const rateLimit = __webpack_require__(/*! express-rate-limit */ "express-rate-limit");
const cors = __webpack_require__(/*! cors */ "cors");
const timeout = __webpack_require__(/*! connect-timeout */ "connect-timeout");
const { loadNLPModel, saveNLPModel, NLPModel } = __webpack_require__(/*! ../modules/nlp/nlpModel */ "./modules/nlp/nlpModel.js");
//const winston = require("winston");
const redis = __webpack_require__(/*! ../config/redis */ "./config/redis.js");
const fs = __webpack_require__(/*! fs */ "fs");
const path = __webpack_require__(/*! path */ "path");
const port = process.env.PORT || 8889;
const { logger, logConversation, getFrequentQuestions } = __webpack_require__(/*! ../modules/logging/logger */ "./modules/logging/logger.js");
//logger.error("This is an error message");

// Import dei moduli
const { getIntent } = __webpack_require__(/*! ../modules/intent/intentRecognizer */ "./modules/intent/intentRecognizer.js");
const { generateResponse } = __webpack_require__(/*! ../modules/nlp/transformer */ "./modules/nlp/transformer.js");
//const { logConversation } = require("../modules/logging/logger");

// Inizializza il manager NLP
//const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Configurazione del logger con Winston
const logDir =  true ? "/tmp/logs" : 0;
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
if (__webpack_require__.c[__webpack_require__.s] === module && !process.env.NETLIFY) {
  app.listen(port, () => logger.info(`Server running on port ${port}`));
}

module.exports = { app, handler: serverless(app), redis };

/***/ }),

/***/ "./config/redis.js":
/*!*************************!*\
  !*** ./config/redis.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

(__webpack_require__(/*! dotenv */ "dotenv").config)();
const Redis = __webpack_require__(/*! ioredis */ "ioredis");
const winston = __webpack_require__(/*! winston */ "winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
  family: 4,
});

redis.on("connect", () => logger.info("✅ Redis connesso con successo."));
redis.on("error", (err) => logger.error("❌ Errore connessione Redis:", err.message));

module.exports = redis;

/***/ }),

/***/ "./modules/intent/intentRecognizer.js":
/*!********************************************!*\
  !*** ./modules/intent/intentRecognizer.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

(__webpack_require__(/*! dotenv */ "dotenv").config)();
const { loadNLPModel, saveNLPModel, NLPModel } = __webpack_require__(/*! ../nlp/nlpModel */ "./modules/nlp/nlpModel.js");

const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });

// ✅ **Predefined Intents & Responses**
const predefinedIntents = {
  "greeting": "Hello! How can I assist you today?",
  "farewell": "Goodbye! Have a great day!",
  "channels": "Here are the official channels:\n- Twitter: https://x.com/heilelon_\n- Instagram: https://instagram.com/heil.elonmusk\n- Telegram: https://t.me/heil_elon",
  "help": "I can help you with information about Helon, its ecosystem, and tokens. Just ask!"
};

// ✅ **Train NLP Model**
async function trainNLP() {
  console.log("🧠 Training NLP Model...");

  manager.addDocument('en', 'hello', 'greeting');
  manager.addDocument('en', 'hi there', 'greeting');
  manager.addDocument('en', 'goodbye', 'farewell');
  manager.addDocument('en', 'bye', 'farewell');
  manager.addDocument('en', 'where can I find official channels?', 'channels');
  manager.addDocument('en', 'how can I contact Helon?', 'channels');
  manager.addDocument('en', 'help', 'help');
  manager.addDocument('en', 'what can you do?', 'help');

  await manager.train();
  console.log("✅ NLP Model Trained Successfully!");

  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  console.log("✅ NLP Model saved in MongoDB");
}

// ✅ **Intent Recognition Function**
async function getIntent(question) {
  console.log(`🔍 Analyzing intent for: "${question}"`);

  const result = await manager.process('en', question);
  
  if (result.intent && result.score > 0.7) {
    console.log(`✅ Intent Detected: "${result.intent}" (Score: ${result.score})`);
    
    if (predefinedIntents[result.intent]) {
      return { intent: result.intent, answer: predefinedIntents[result.intent], score: result.score };
    }
    
    return { intent: result.intent, answer: null, score: result.score };
  }

  console.warn("⚠ Unrecognized Intent - Fallback Triggered.");
  return { intent: "unknown", answer: "I'm not sure how to answer that yet. Try rephrasing?", score: 0 };
}

// ✅ **Train Model on Startup**
async function initializeNLP() {
  const savedModel = await loadNLPModel();
  if (savedModel) {
    manager.import(savedModel);
    console.log("🧠 NLP Model Loaded from DB");
  } else {
    console.log("🚀 Training new NLP Model...");
    await trainNLP();
  }
}

module.exports = { getIntent, initializeNLP, trainModel };

/***/ }),

/***/ "./modules/logging/logger.js":
/*!***********************************!*\
  !*** ./modules/logging/logger.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

(__webpack_require__(/*! dotenv */ "dotenv").config)();
const mongoose = __webpack_require__(/*! mongoose */ "mongoose");

const LOG_RETENTION_DAYS = 30; // Auto-delete logs older than this
const MONGO_URI = process.env.MONGO_URI;

const winston = __webpack_require__(/*! winston */ "winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    // Aggiungi altri transport se necessario (es. File)
  ]
});

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! Logging is disabled.");
  process.exit(1);
}

// Connessione a MongoDB per il logging
mongoose.connect(MONGO_URI, { })
  .then(() => console.log("📜 Connected to MongoDB for logging"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Schema per il logging delle conversazioni
const logSchema = new mongoose.Schema({
  userId: { type: String, default: "anonymous" },
  question: { type: String, required: true },
  answer: { type: String, required: true }, // Salvato sempre come stringa (JSON)
  detectedIntent: { type: String },
  confidence: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

// Creazione del modello ConversationLog
const ConversationLog = mongoose.models.ConversationLog || mongoose.model('ConversationLog', logSchema);

// Funzione per loggare una conversazione
async function logConversation({ userId, question, answer, detectedIntent, confidence }) {
  try {
    const logEntry = new ConversationLog({
      userId,
      question,
      answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      detectedIntent,
      confidence
    });

    await logEntry.save();
    console.log("📝 Conversation logged successfully.");
  } catch (error) {
    console.error("❌ Error logging conversation:", error);
  }
}

// Funzione per recuperare le domande più frequenti
async function getFrequentQuestions(limit = 5) {
  try {
    const results = await ConversationLog.aggregate([
      { $group: { _id: "$question", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    if (!Array.isArray(results)) {
      console.error("❌ Expected aggregation results to be an array, got:", results);
      return [];
    }
    
    return results.map(q => ({ question: q._id, count: q.count }));
  } catch (error) {
    console.error("❌ Error retrieving frequent questions:", error);
    return [];
  }
}

// Funzione per eliminare automaticamente i log vecchi (Retention Policy)
async function cleanupOldLogs() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);
    const result = await ConversationLog.deleteMany({ timestamp: { $lt: cutoff } });
    console.log(`🗑 Deleted ${result.deletedCount} old log entries.`);
  } catch (error) {
    console.error("❌ Error deleting old logs:", error);
  }
}

// Pianifica la pulizia dei log ogni 24 ore
const intervalId = setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
intervalId.unref();

module.exports = { 
  logger, 
  logConversation, 
  getFrequentQuestions 
};

/***/ }),

/***/ "./modules/nlp/nlpModel.js":
/*!*********************************!*\
  !*** ./modules/nlp/nlpModel.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const mongoose = __webpack_require__(/*! mongoose */ "mongoose");
const { logger, logConversation, getFrequentQuestions } = __webpack_require__(/*! ../logging/logger */ "./modules/logging/logger.js");

const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ Carica il modello NLP dal database
async function loadNLPModel() {
  try {
    const savedModel = await NLPModel.findOne({});
    if (savedModel) {
      logger.info("✅ NLP Model loaded from MongoDB");
      return savedModel.modelData;
    }
    logger.warn("⚠️ No NLP Model found in database. Training required.");
    return null;
  } catch (error) {
    logger.error("❌ Error loading NLP model:", error.message);
    throw error;
  }
}

// ✅ Salva il modello NLP nel database
async function saveNLPModel(modelData) {
  try {
    const result = await NLPModel.updateOne({}, { modelData }, { upsert: true });
    logger.info("✅ NLP Model saved in MongoDB");
    return result;
  } catch (error) {
    logger.error("❌ Error saving NLP model:", error.message);
    throw error;
  }
}

module.exports = { loadNLPModel, saveNLPModel, NLPModel };

/***/ }),

/***/ "./modules/nlp/transformer.js":
/*!************************************!*\
  !*** ./modules/nlp/transformer.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

(__webpack_require__(/*! dotenv */ "dotenv").config)();
const OpenAI = __webpack_require__(/*! openai */ "openai");
const mongoose = __webpack_require__(/*! mongoose */ "mongoose");
const { logger, logConversation, getFrequentQuestions } = __webpack_require__(/*! ../logging/logger */ "./modules/logging/logger.js");

// ✅ Load OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! Knowledge Base will not function.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("📚 Connected to MongoDB for Knowledge Base"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ **Knowledge Base Schema**
const knowledgeSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
  source: { type: String, default: "Knowledge Base" },
  createdAt: { type: Date, default: Date.now }
});

const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", knowledgeSchema);

// ✅ **Check Knowledge Base Before Calling GPT**
async function getAnswerFromKnowledgeBase(question) {
  try {
    const result = await Knowledge.findOne({ question: new RegExp(`^${question}$`, 'i') });
    if (result) {
      console.log(`📖 Answer found in Knowledge Base for: "${question}"`);
      return { answer: result.answer, source: result.source };
    }
    return null;
  } catch (error) {
    console.error("❌ Error querying Knowledge Base:", error);
    return null;
  }
}

// ✅ **Generate AI Response Using GPT (if needed)**
async function generateResponse(question) {
  try {
    // 🔹 Step 1: First check the Knowledge Base
    const knowledgeResponse = await getAnswerFromKnowledgeBase(question);
    if (knowledgeResponse) return knowledgeResponse;

    // 🔹 Step 2: If not found, ask GPT-3.5
    console.log(`🤖 Querying GPT-3.5 for: "${question}"`);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Using cost-effective model
      messages: [{ role: "user", content: question }],
      max_tokens: 100,  // Limits response length to reduce token usage
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("Empty response from GPT");

    // 🔹 Step 3: Store AI-generated response in Knowledge Base
    const newEntry = new Knowledge({ question, answer, source: "GPT-3.5" });
    await newEntry.save();
    console.log("✅ Saved GPT response to Knowledge Base.");

    return { answer, source: "GPT-3.5" };
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return { answer: "Sorry, I'm having trouble processing your request.", source: "Ultron AI" };
  }
}

module.exports = { generateResponse };

/***/ }),

/***/ "connect-timeout":
/*!**********************************!*\
  !*** external "connect-timeout" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("connect-timeout");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("cors");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("dotenv");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("express");

/***/ }),

/***/ "express-rate-limit":
/*!*************************************!*\
  !*** external "express-rate-limit" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("express-rate-limit");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "ioredis":
/*!**************************!*\
  !*** external "ioredis" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("ioredis");

/***/ }),

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("mongoose");

/***/ }),

/***/ "openai":
/*!*************************!*\
  !*** external "openai" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("openai");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "serverless-http":
/*!**********************************!*\
  !*** external "serverless-http" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("serverless-http");

/***/ }),

/***/ "winston":
/*!**************************!*\
  !*** external "winston" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("winston");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(__webpack_require__.s = "./api/server.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=server.bundle.js.map