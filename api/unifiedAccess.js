require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const redis = require("../config/redis");
const logger = require("../modules/logging/logger");

const app = express();
const router = express.Router();

// === Configurazione Redis ===
//const REDIS_HOST = process.env.REDIS_HOST;
//const REDIS_PORT = process.env.REDIS_PORT;
//const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

//if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
//  console.error("❌ ERROR: Redis environment variables are missing!");
//  process.exit(1);
//}

//const redis = new Redis({
//  host: REDIS_HOST,
//  port: REDIS_PORT,
//  password: REDIS_PASSWORD,
//  tls: { rejectUnauthorized: false }, // Miglioramento per Upstash
//  enableOfflineQueue: false,
//  connectTimeout: 5000,
//  retryStrategy: (times) => Math.min(times * 100, 2000),
// });

//redis.on("connect", () => {
//  console.log("✅ Connected to Redis successfully!");
//});

//redis.on("error", (err) => {
//  console.error("❌ Redis connection error:", err.message);
//});

// === Logger e Directory dei Log ===
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.error("❌ Error creating logs directory:", err.message);
  }
}

//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(
//      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
//    )
//  ),
//  transports: [
//    new winston.transports.Console(),
//    new winston.transports.File({ filename: path.join(logsDir, "app.log") }),
//  ],
//});

// === Verifica delle Variabili d'Ambiente Richieste ===
const requiredEnvVars = [
  "MONGO_URI",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "MY_GITHUB_OWNER",
  "MY_GITHUB_REPO",
  "MY_GITHUB_TOKEN",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// === Middleware e Rate Limiting ===
app.set("trust proxy", 1); // Fidarsi del proxy di Netlify
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"] || "unknown-ip",
});
app.use(limiter);
app.use(cors());
app.use(express.json());

// === Connessione a MongoDB ===
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

// === Schema e Modello per la Knowledge Base ===
const KnowledgeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
});
const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", KnowledgeSchema);

// === Middleware per Cache Redis ===
const cacheMiddleware = async (req, res, next) => {
  const key = req.originalUrl;
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      logger.info(`🔹 Serving from Redis cache: ${key}`);
      return res.json(JSON.parse(cachedData));
    }
  } catch (error) {
    logger.warn("⚠️ Redis error, proceeding without cache:", error.message);
  }

  res.sendResponse = res.json;
  res.json = (body) => {
    if (!res.headersSent) {
      redis.setex(key, 60, JSON.stringify(body)).catch((err) => {
        logger.warn("⚠️ Failed to store response in Redis cache:", err.message);
      });
      res.sendResponse(body);
    }
  };
  next();
};

// === Endpoint: Health Check ===
router.get("/health", async (req, res) => {
  try {
    logger.info("🔹 Health check started...");

    let mongoStatus = "Disconnected";
    if (mongoose.connection.readyState === 1) {
      mongoStatus = "Connected";
    } else {
      throw new Error("MongoDB not connected");
    }

    let redisStatus = "Disconnected";
    await redis
      .ping()
      .then(() => {
        redisStatus = "Connected";
      })
      .catch((err) => {
        throw new Error("Redis not connected: " + err.message);
      });

    logger.info(`✅ MongoDB: ${mongoStatus}, Redis: ${redisStatus}`);
    res.json({ status: "✅ Healthy", mongo: mongoStatus, redis: redisStatus });
  } catch (error) {
    logger.error(`❌ Health check failed: ${error.message}`);
    res.status(500).json({ error: "Service is unhealthy", details: error.message });
  }
});

// === Endpoint: Recupero Dati da GitHub o MongoDB ===
router.get("/fetch", cacheMiddleware, async (req, res) => {
  const { source, file, query } = req.query;
  try {
    if (!source)
      return res.status(400).json({ error: "Missing source parameter." });

    if (source === "github") {
      if (!file)
        return res.status(400).json({ error: "Missing file parameter." });
      const repoUrl = `https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/contents/${file}`;
      logger.info(`🔹 Fetching from GitHub: ${repoUrl}`);
      // Imposta un timeout per evitare blocchi (5000ms)
      const response = await axios.get(repoUrl, {
        headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` },
        timeout: 5000,
      });
      if (!response.data.download_url)
        return res
          .status(404)
          .json({ error: "GitHub API Error: File not found." });
      const fileResponse = await axios.get(response.data.download_url, {
        timeout: 5000,
      });
      return res.json({ file, content: fileResponse.data });
    }

    if (source === "mongodb") {
      if (!query)
        return res.status(400).json({ error: "Missing query parameter." });
      const data = await Knowledge.findOne({ key: query });
      if (!data)
        return res.status(404).json({ error: "No data found in MongoDB" });
      return res.json(data);
    }

    return res.status(400).json({ error: "Invalid source parameter." });
  } catch (error) {
    logger.error("❌ Fetch Error:", error.message);
    res
      .status(500)
      .json({ error: "Unexpected error fetching data", details: error.message });
  }
});

// === Esposizione dell'Endpoint Unified Access ===
app.use("/.netlify/functions/unifiedAccess", router);

module.exports = { app, handler: serverless(app), redis };