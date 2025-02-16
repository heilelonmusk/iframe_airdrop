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

// ✅ **Verifica delle Variabili d'Ambiente**
const checkEnvVariables = () => {
  const requiredEnvVars = ["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD"];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

// ✅ **Connessione a Redis con TLS (necessario per Upstash)**
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {}, // ✅ NECESSARIO per Upstash Redis
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});

redis.on("connect", () => logger.info("✅ Redis connesso con successo."));
redis.on("error", (err) => logger.error("❌ Errore connessione Redis:", err.message));

// ✅ **Test per Redis**
(async () => {
  try {
    checkEnvVariables();
    checkRedisProcess();

    logger.info("🔹 Controllo connessione Redis...");
    const isConnected = await redis.ping().catch(() => null);
    if (isConnected !== "PONG") {
      throw new Error("Redis non sta rispondendo.");
    }

    // 🗑️ Pulizia iniziale
    logger.info("🗑️ Pulizia Redis prima dei test...");
    try {
      await redis.flushdb();
    } catch (cleanupError) {
      logger.warn("⚠️ Impossibile eseguire flush su Redis prima del test.");
    }

    // 🔹 Impostazione Chiave di Test
    logger.info("🔹 Inserimento chiave di test in Redis...");
    const startTime = Date.now();
    await redis.set("test_key", "Hello Redis!", "EX", 60);

    // 🔹 Recupero Chiave di Test
    logger.info("🔹 Recupero chiave di test da Redis...");
    const value = await redis.get("test_key");
    const latency = Date.now() - startTime;

    if (value) {
      logger.info(`✅ Chiave recuperata con successo: ${value} (Latenza: ${latency}ms)`);
    } else {
      logger.warn("⚠️ Valore nullo ricevuto. La chiave potrebbe essere scaduta.");
    }

    // 🔹 Verifica Persistenza
    logger.info("🔹 Controllo persistenza chiave...");
    const exists = await redis.exists("test_key");
    if (exists) {
      logger.info("✅ La chiave è presente in Redis.");
    } else {
      logger.warn("⚠️ La chiave non esiste in Redis.");
    }

    // 🔹 Eliminazione Chiave
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
    // 🗑️ Cleanup finale
    logger.info("🗑️ Pulizia finale di Redis...");
    try {
      await redis.flushdb();
      logger.info("✅ Redis ripulito con successo.");
    } catch (cleanupError) {
      logger.warn("⚠️ Errore nella pulizia di Redis:", cleanupError.message);
    }

    await redis.quit();
    logger.info("🔹 Connessione Redis chiusa.");
  }
})();