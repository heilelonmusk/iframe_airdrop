require("dotenv").config({ debug: true });
const { redis, quitRedis, cacheMiddleware } = require("../config/redis");
const winston = require("winston");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const mongoose = require("mongoose");
const { logger } = require("../modules/logging/logger");
logger.info(`🔹 Fetching from GitHub: https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/README.md`);

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("❌ Redis environment variables are missing.");
}

// 📁 Assicuriamoci che la cartella dei log esista
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 🚀 Winston Logger Setup
({
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
//const checkRedisProcess = () => {
  if (process.env.REDIS_HOST === "localhost" || process.env.REDIS_HOST === "127.0.0.1") {
    try {
      const runningProcesses = execSync("ps aux | grep redis-server | grep -v grep").toString();
      if (runningProcesses && runningProcesses.trim() !== "") {
        logger.warn("⚠️ Redis potrebbe essere già in esecuzione. Verifica prima di procedere.");
        // Puoi decidere di terminare o semplicemente loggare l'avviso
      }
    } catch (error) {
      logger.info("✅ Nessun processo Redis attivo trovato. Procediamo con il test.");
    }
  } else {
    logger.info("✅ Redis host è remoto, saltiamo il controllo dei processi locali.");
  }
//};

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


// Aspettiamo che Redis sia pronto prima di inviare comandi
const waitForReady = () => {
  return new Promise((resolve, reject) => {
    if (redis.status === "ready") {
      resolve();
    } else {
      const readyHandler = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout waiting for Redis ready"));
      }, 15000);
      redis.once("ready", readyHandler);
    }
  });
};

describe("Test di base per Redis", () => {
  test("Verifica che Redis risponda al PING", async () => {
    logger.info("🔹 Attesa che Redis sia pronto...");
    await waitForReady();
    logger.info("🔹 Redis pronto: " + redis.status);
    const redisPing = await redis.ping();
    expect(redisPing).toBe("PONG");
  });
});

describe("Operazioni avanzate su Redis", () => {
  test("Imposta, recupera ed elimina una chiave di test", async () => {
    logger.info("🔹 Attesa che Redis sia pronto...");
    await waitForReady();
    logger.info("🔹 Redis status: " + redis.status);
    
    // Pulizia iniziale
    logger.info("🗑️ Pulizia Redis prima dei test...");
    try {
      await redis.flushdb();
    } catch (cleanupError) {
      logger.warn("⚠️ Impossibile eseguire flush su Redis prima del test:", cleanupError.message);
    }
    
    // Impostazione della chiave di test
    logger.info("🔹 Inserimento chiave di test in Redis...");
    const startTime = Date.now();
    await redis.set("test_key", "Hello Redis!", "EX", 60);
    
    // Recupero della chiave di test
    logger.info("🔹 Recupero chiave di test da Redis...");
    const value = await redis.get("test_key");
    const latency = Date.now() - startTime;
    expect(value).toBe("Hello Redis!");
    logger.info(`✅ Chiave recuperata: ${value} (Latenza: ${latency}ms)`);
    
    // Verifica della persistenza
    logger.info("🔹 Controllo persistenza chiave...");
    const exists = await redis.exists("test_key");
    expect(exists).toBe(1);
    
    // Eliminazione della chiave
    logger.info("🔹 Eliminazione chiave di test...");
    await redis.del("test_key");
    const deletedCheck = await redis.get("test_key");
    expect(deletedCheck).toBeNull();
    logger.info("✅ Chiave eliminata correttamente.");
  });
});

afterAll(async () => {
  logger.info("🗑️ Pulizia finale di Redis...");
  
  try {
    if (redis.status === "ready") {
      logger.info("✅ Redis ripulito con successo.");
    } else {
      logger.warn("⚠️ Redis non è nello stato 'ready', saltando flushdb.");
    }
  } catch (cleanupError) {
    logger.warn("⚠️ Errore nella pulizia di Redis:", cleanupError.message);
  } finally {
    try {
      await redis.quit();
      logger.info("🔹 Connessione Redis chiusa.");
    } catch (quitError) {
      logger.warn("⚠️ Errore durante la chiusura della connessione Redis, forzando disconnect:", quitError.message);
      quitRedis();
    }
  }
});