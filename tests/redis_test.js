require("dotenv").config();
const Redis = require("ioredis");
const winston = require("winston");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 📁 Assicuriamoci che la cartella dei log esista (Usiamo /tmp per Netlify)
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.error("❌ Error creating logs directory:", err.message);
  }
}

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, "redis_test.log") }),
  ],
});

// ✅ Verifica processi attivi su Redis
const checkRedisProcess = () => {
  try {
    const runningProcesses = execSync("ps aux | grep redis-server | grep -v grep").toString();
    if (runningProcesses) {
      logger.warn("⚠️ Redis potrebbe essere già in esecuzione. Verifica prima di procedere.");
    }
  } catch (error) {
    logger.info("✅ Nessun processo Redis attivo trovato. Procediamo con il test.");
  }
};

// ✅ Ensure Redis URL is set
if (!process.env.REDIS_URL) {
  logger.error("❌ Missing REDIS_URL environment variable");
  process.exit(1);
}

// 🚀 Connect to Redis with Retry Strategy
let redis;
try {
  const redis = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });

  redis.on("connect", () => {
    logger.info("✅ Connected to Redis successfully!");
  });

  redis.on("error", (err) => {
    logger.error("❌ Redis connection error:", err.message);
  });

} catch (error) {
  logger.error("❌ Critical Error: Unable to initialize Redis client.", error.message);
  process.exit(1);
}

// ✅ Redis Test Operations
(async () => {
  try {
    checkRedisProcess();

    logger.info("🔹 Checking Redis connection...");
    const isConnected = await redis.ping().catch(() => null);
    if (isConnected !== "PONG") {
      throw new Error("Redis is not responding.");
    }

    // 🗑️ Pulizia iniziale solo se Redis è connesso
    logger.info("🗑️ Cleaning up Redis before tests...");
    try {
      await redis.flushdb();
    } catch (cleanupError) {
      logger.warn("⚠️ Unable to flush Redis before test. It may not be fully connected.");
    }

    // 🔹 Impostazione Chiave
    logger.info("🔹 Setting test key in Redis...");
    const startTime = Date.now();
    await redis.set("test_key", "Hello Redis!", "EX", 60);

    // 🔹 Recupero Chiave
    logger.info("🔹 Retrieving test key from Redis...");
    const value = await redis.get("test_key");
    const latency = Date.now() - startTime;

    if (value) {
      logger.info(`✅ Retrieved value: ${value} (Latency: ${latency}ms)`);
    } else {
      logger.warn("⚠️ Retrieved null value, key might have expired.");
    }

    // 🔹 Verifica Persistenza
    logger.info("🔹 Checking key persistence...");
    const exists = await redis.exists("test_key");
    if (exists) {
      logger.info("✅ Key exists in Redis.");
    } else {
      logger.warn("⚠️ Key does not exist in Redis.");
    }

    // 🔹 Test Eliminazione Chiave
    logger.info("🔹 Deleting test key...");
    await redis.del("test_key");

    const deletedCheck = await redis.get("test_key");
    if (!deletedCheck) {
      logger.info("✅ Key successfully deleted.");
    } else {
      logger.error("❌ Key deletion failed.");
    }

  } catch (error) {
    logger.error("❌ Redis test failed:", error.message);
  } finally {
    // 🗑️ Cleanup finale solo se Redis è connesso
    logger.info("🗑️ Final cleanup of Redis...");
    try {
      await redis.flushdb();
      logger.info("✅ Redis cleaned successfully.");
    } catch (cleanupError) {
      logger.warn("⚠️ Redis cleanup failed:", cleanupError.message);
    }

    await redis.quit();
    logger.info("🔹 Redis connection closed.");
  }
})();