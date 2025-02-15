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

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

const requiredEnvVars = ["MONGO_URI", "REDIS_URL", "MY_GITHUB_OWNER", "MY_GITHUB_REPO", "MY_GITHUB_TOKEN"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => logger.info("✅ MongoDB Connected Successfully"))
.catch((err) => {
  logger.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});

const KnowledgeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
});
const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", KnowledgeSchema);

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

    if (source === "netlify") {
      if (!file) return res.status(400).json({ error: "Missing file parameter." });
      const filePath = path.join(process.cwd(), "public", file);
      if (fs.existsSync(filePath)) return res.sendFile(filePath);
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
    redis.del(`/fetch?source=mongodb&query=${key}`).catch((err) => {
      logger.warn(`⚠️ Redis cache deletion failed for key: ${key}`, err.message);
    });
    res.json({ message: "✅ Data stored successfully", data: record });
  } catch (error) {
    logger.error("❌ Storage Error:", error.message);
    res.status(500).json({ error: "Error storing data", details: error.message });
  }
});

app.use("/.netlify/functions/unifiedAccess", router);
module.exports = { app, handler: serverless(app) };
