require("dotenv").config();
const Redis = require("ioredis");
const winston = require("winston");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 📁 Assicuriamoci che la cartella dei log esista
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, "redis_test.log") }),
  ],
});

// ✅ Verifica processi attivi su Redis (solo se il Redis host è locale)
const checkRedisProcess = () => {
  if (process.env.REDIS_HOST === "localhost" || process.env.REDIS_HOST === "127.0.0.1") {
    try {
      const runningProcesses = execSync("ps aux | grep redis-server | grep -v grep").toString();
      if (runningProcesses && runningProcesses.trim() !== "") {
        logger.warn("⚠️ Redis potrebbe essere già in esecuzione. Verifica prima di procedere.");
        process.exit(1);
      }
    } catch (error) {
      logger.info("✅ Nessun processo Redis attivo trovato. Procediamo con il test.");
    }
  } else {
    logger.info("✅ Redis host è remoto, saltiamo il controllo dei processi locali.");
  }
};

// ✅ Verifica delle Variabili d'Ambiente
const checkEnvVariables = () => {
  const requiredEnvVars = ["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD"];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

checkEnvVariables();
checkRedisProcess();

// ✅ Connessione a Redis con TLS (necessario per Upstash)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false }, // Aggiunto rejectUnauthorized: false
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});

redis.on("connect", () => logger.info("✅ Redis connesso con successo."));
redis.on("error", (err) => logger.error("❌ Errore connessione Redis:", err.message));

// ✅ Test per Redis
(async () => {
  try {
    logger.info("🔹 Controllo connessione Redis...");
    const isConnected = await redis.ping().catch((err) => {
      logger.error("Ping error:", err.message);
      return null;
    });
    if (isConnected !== "PONG") {
      throw new Error("Redis non sta rispondendo.");
    }

    // 🗑️ Pulizia iniziale
    logger.info("🗑️ Pulizia Redis prima dei test...");
    try {
      await redis.flushdb();
    } catch (cleanupError) {
      logger.warn("⚠️ Impossibile eseguire flush su Redis prima del test:", cleanupError.message);
    }

    // 🔹 Impostazione della chiave di test
    logger.info("🔹 Inserimento chiave di test in Redis...");
    const startTime = Date.now();
    await redis.set("test_key", "Hello Redis!", "EX", 60);

    // 🔹 Recupero della chiave di test
    logger.info("🔹 Recupero chiave di test da Redis...");
    const value = await redis.get("test_key");
    const latency = Date.now() - startTime;

    if (value) {
      logger.info(`✅ Chiave recuperata con successo: ${value} (Latenza: ${latency}ms)`);
    } else {
      logger.warn("⚠️ Valore nullo ricevuto. La chiave potrebbe essere scaduta.");
    }

    // 🔹 Verifica della persistenza della chiave
    logger.info("🔹 Controllo persistenza chiave...");
    const exists = await redis.exists("test_key");
    if (exists) {
      logger.info("✅ La chiave è presente in Redis.");
    } else {
      logger.warn("⚠️ La chiave non esiste in Redis.");
    }

    // 🔹 Eliminazione della chiave di test
    logger.info("🔹 Eliminazione chiave di test...");
    await redis.del("test_key");

    const deletedCheck = await redis.get("test_key");
    if (!deletedCheck) {
      logger.info("✅ Chiave eliminata correttamente.");
    } else {
      logger.error("❌ Errore nell'eliminazione della chiave.");
    }

  } catch (error) {
    logger.error("❌ Test Redis fallito:", error.message);
  } finally {
    // 🗑️ Pulizia finale
    logger.info("🗑️ Pulizia finale di Redis...");
    try {
      await redis.flushdb();
      logger.info("✅ Redis ripulito con successo.");
    } catch (cleanupError) {
      logger.warn("⚠️ Errore nella pulizia di Redis:", cleanupError.message);
    }
    try {
      await redis.quit();
      logger.info("🔹 Connessione Redis chiusa.");
    } catch (quitError) {
      logger.warn("⚠️ Errore durante la chiusura della connessione Redis, forzando disconnect:", quitError.message);
      redis.disconnect();
    }
  }
})();