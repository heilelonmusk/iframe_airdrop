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
const redis = new Redis(process.env.REDIS_URL);

// 🚀 Winston Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// ✅ Ensure environment variables exist
const requiredEnvVars = ["MONGO_URI", "REDIS_URL", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_TOKEN"];
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

// 📌 Optimized MongoDB Connection
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

// 🚀 Redis Cache Wrapper
const cacheMiddleware = async (req, res, next) => {
  const key = req.originalUrl;
  const cachedData = await redis.get(key);
  if (cachedData) {
    logger.info(`🔹 Serving from Redis cache: ${key}`);
    return res.json(JSON.parse(cachedData));
  }
  res.sendResponse = res.json;
  res.json = (body) => {
    redis.setex(key, 60, JSON.stringify(body));
    res.sendResponse(body);
  };
  next();
};

// 📌 API Health Check
router.get("/health", async (req, res) => {
  try {
    // MongoDB Check
    await mongoose.connection.db.admin().ping();
    // Redis Check
    await redis.ping();

    res.json({ status: "✅ Healthy", mongo: "Connected", redis: "Connected" });
  } catch (error) {
    logger.error("❌ Health check failed:", error.message);
    res.status(500).json({ error: "Service is unhealthy" });
  }
});

/**
 * 📌 Route: GET /.netlify/functions/unifiedAccess/fetch
 * Fetch data from GitHub, Netlify, or MongoDB
 */
router.get("/fetch", cacheMiddleware, async (req, res) => {
  const { source, file, query } = req.query;
  try {
    if (!source) return res.status(400).json({ error: "Missing source parameter." });

    if (source === "github") {
      if (!file) return res.status(400).json({ error: "Missing file parameter." });

      const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${file}`;
      logger.info(`🔹 Fetching from GitHub: ${repoUrl}`);

      const response = await axios.get(repoUrl, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
      });

      if (!response.data.download_url) {
        return res.status(404).json({ error: "GitHub API Error: File not found." });
      }
      const fileResponse = await axios.get(response.data.download_url);
      return res.json({ file, content: fileResponse.data });
    }

    if (source === "netlify") {
      if (!file) return res.status(400).json({ error: "Missing file parameter." });
      const filePath = path.join(process.cwd(), "public", file);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      return res.status(404).json({ error: "File not found in Netlify deployment." });
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

/**
 * 📌 Route: POST /.netlify/functions/unifiedAccess/store
 * Store data in MongoDB
 */
router.post("/store", async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: "Missing key or value." });

  try {
    let record = await Knowledge.findOne({ key });
    if (record) {
      record.value = value;
      await record.save();
    } else {
      record = new Knowledge({ key, value });
      await record.save();
    }
    redis.del("/fetch?source=mongodb&query=" + key);
    res.json({ message: "✅ Data stored successfully", data: record });
  } catch (error) {
    logger.error("❌ Storage Error:", error.message);
    res.status(500).json({ error: "Error storing data", details: error.message });
  }
});

app.use("/.netlify/functions/unifiedAccess", router);
module.exports = { app, handler: serverless(app) };