require("dotenv").config();
const Redis = require("ioredis");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ✅ Connessione a Redis
console.log("🔹 REDIS_HOST:", process.env.REDIS_HOST);
console.log("🔹 REDIS_PORT:", process.env.REDIS_PORT);
console.log("🔹 REDIS_PASSWORD:", process.env.REDIS_PASSWORD ? "********" : "Not Set");

const redis = new Redis(("rediss://default:********@communal-puma-15051.upstash.io:6379"),{
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {}, // Upstash richiede TLS
  reconnectOnError: (err) => {
    logger.warn(`⚠️ Redis error: ${err.message}, attempting reconnect...`);
    return true;
  },
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error("❌ Too many Redis reconnection attempts. Stopping...");
      return null;
    }
    return Math.min(times * 1000, 30000);
  },
});

redis.on("connect", () => logger.info("✅ Connected to Redis successfully!"));
redis.on("ready", () => logger.info("✅ Redis Ready!"));
redis.on("error", (err) => logger.error(`❌ Redis connection error: ${err.message}`));
redis.on("end", () => {
  logger.warn("⚠️ Redis connection closed. Reconnecting...");
  setTimeout(() => redis.connect(), 5000);
});

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

/**
 * 🔹 Chiude correttamente la connessione Redis
 */
const quitRedis = async () => {
  if (!redis || redis.status === "end") return;
  try {
    logger.info("🛑 Chiusura connessione Redis...");
    await redis.quit();
    logger.info("✅ Redis disconnesso correttamente.");
  } catch (error) {
    logger.warn("⚠️ Errore durante la chiusura di Redis:", error.message);
  }
};

// Chiude Redis in caso di terminazione del processo
process.on("SIGINT", async () => {
  logger.info("⚠️ SIGINT ricevuto, chiusura Redis...");
  await quitRedis();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("⚠️ SIGTERM ricevuto, chiusura Redis...");
  await quitRedis();
  process.exit(0);
});

module.exports = { redis, quitRedis, cacheMiddleware };