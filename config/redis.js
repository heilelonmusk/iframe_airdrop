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

 //✅ Connessione a Redis con TLS (necessario per Upstash)
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