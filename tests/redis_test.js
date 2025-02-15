require("dotenv").config();
const Redis = require("ioredis");
const winston = require("winston");

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/redis_test.log" }),
  ],
});

// ✅ Ensure Redis URL is set
if (!process.env.REDIS_URL) {
  logger.error("❌ Missing REDIS_URL environment variable");
  process.exit(1);
}

// 🚀 Connect to Redis with Retry Strategy
const redis = new Redis(process.env.REDIS_URL, {
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false, // Ensures stability in testing
  connectTimeout: 5000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 2000); // Exponential backoff up to 2s
    logger.warn(`⚠️ Redis reconnect attempt #${times}, retrying in ${delay}ms...`);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("✅ Connected to Redis successfully!");
});

redis.on("error", (err) => {
  logger.error("❌ Redis connection error:", err.message);
});

// ✅ Redis Test Operations
(async () => {
  try {
    logger.info("🔹 Checking Redis connection...");
    const isConnected = await redis.ping();
    if (isConnected !== "PONG") {
      throw new Error("Redis is not responding.");
    }

    logger.info("🔹 Setting test key in Redis...");
    const startTime = Date.now();
    await redis.set("test_key", "Hello Redis!", "EX", 60);

    logger.info("🔹 Retrieving test key from Redis...");
    const value = await redis.get("test_key");
    const latency = Date.now() - startTime;

    if (value) {
      logger.info(`✅ Retrieved value: ${value} (Latency: ${latency}ms)`);
    } else {
      logger.warn("⚠️ Retrieved null value, key might have expired.");
    }
  } catch (error) {
    logger.error("❌ Redis test failed:", error.message);
  } finally {
    await redis.quit();
    logger.info("🔹 Redis connection closed.");
  }
})();