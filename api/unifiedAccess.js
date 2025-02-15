require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const Redis = require("ioredis");
const winston = require("winston");

const app = express();
const router = express.Router();

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: false,
  connectTimeout: 5000,
});

// 📁 Assicurarsi che la cartella dei log esista (Usiamo /tmp/logs per Netlify)
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.error("❌ Error creating logs directory:", err.message);
  }
}

// 🚀 Logger Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, "app.log") }),
  ],
});

// ✅ Verifica delle variabili d'ambiente richieste
const requiredEnvVars = ["MONGO_URI", "REDIS_URL", "MY_GITHUB_OWNER", "MY_GITHUB_REPO", "MY_GITHUB_TOKEN"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// 🛡️ Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);
app.use(cors());
app.use(express.json());

// 📌 Connessione a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => logger.info("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    logger.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

const KnowledgeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
});
const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", KnowledgeSchema);

// 🚀 Middleware cache Redis
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

// 📌 API Health Check
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

// 📌 Recupero dati da GitHub, Netlify o MongoDB
router.get("/fetch", cacheMiddleware, async (req, res) => {
  const { source, file, query } = req.query;
  try {
    if (!source) return res.status(400).json({ error: "Missing source parameter." });

    if (source === "github") {
      if (!file) return res.status(400).json({ error: "Missing file parameter." });
      const repoUrl = `https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/contents/${file}`;
      logger.info(`🔹 Fetching from GitHub: ${repoUrl}`);
      const response = await axios.get(repoUrl, { headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` } });
      if (!response.data.download_url) return res.status(404).json({ error: "GitHub API Error: File not found." });
      const fileResponse = await axios.get(response.data.download_url);
      return res.json({ file, content: fileResponse.data });
    }

    if (source === "mongodb") {
      if (!query) return res.status(400).json({ error: "Missing query parameter." });
      const data = await Knowledge.findOne({ key: query });
      if (!data) return res.status(404).json({ error: "No data found in MongoDB" });
      return res.json(data);
    }

    return res.status(400).json({ error: "Invalid source parameter." });
  } catch (error) {
    logger.error("❌ Fetch Error:", error.message);
    res.status(500).json({ error: "Unexpected error fetching data", details: error.message });
  }
});

app.use("/.netlify/functions/unifiedAccess", router);
module.exports = { app, handler: serverless(app) };
