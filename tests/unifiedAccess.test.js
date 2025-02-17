require("dotenv").config();
const { app, handler } = require("../api/unifiedAccess.js");
const request = require("supertest");
const mongoose = require("mongoose");
const redis = require("../config/redis");
//const winston = require("winston");
const { execSync } = require("child_process");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");

jest.setTimeout(30000); // Aumenta il timeout per operazioni asincrone

// 🚀 Configurazione del Logger con Winston
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(
//      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
//    )
//  ),
//  transports: [new winston.transports.Console()],
//});

if (!process.env.NETLIFY && process.env.NODE_ENV !== "production") {
  checkActiveProcesses();
}

const os = require("os");

// 🚀 Controllo processi attivi sulla porta di test
const checkActiveProcesses = () => {
  const testPort = process.env.PORT || 5000; // Usa la porta configurata, se esiste

  try {
    let command;
    if (os.platform() === "win32") {
      // Comando per Windows
      command = `netstat -ano | findstr :${testPort}`;
    } else {
      // Comando per macOS/Linux
      command = `lsof -i :${testPort}`;
    }

    const runningProcesses = execSync(command).toString();
    if (runningProcesses && runningProcesses.trim() !== "") {
      logger.warn(`⚠️ Un altro processo è attivo sulla porta ${testPort}. Questo potrebbe interferire con i test.`);
    }
  } catch (error) {
    logger.info(`✅ Nessun processo attivo sulla porta ${testPort}. Procediamo con i test.`);
  }
};

// ✅ Verifica delle variabili d'ambiente richieste
const checkEnvVariables = () => {
  const requiredEnvVars = [
    "MONGO_URI",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "MY_GITHUB_OWNER",
    "MY_GITHUB_REPO",
    "MY_GITHUB_TOKEN"
  ];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

checkActiveProcesses();
checkEnvVariables();

// Setup prima di tutti i test
beforeAll(async () => {
  logger.info("✅ Connessione al database di test...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ Connessione a MongoDB riuscita.");
    // Attendi un attimo per assicurarti che la connessione sia stabile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Aggiungi i listener per il monitoraggio della connessione
    mongoose.connection.on("error", (err) => logger.error("MongoDB error:", err));
    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected."));
    mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected!"));
  } catch (error) {
    logger.error("❌ Errore di connessione a MongoDB:", error.message);
    process.exit(1);
  }

  try {
    await redis.ping();
    logger.info("✅ Redis connesso con successo.");
  } catch (error) {
    logger.warn("⚠️ Connessione Redis fallita:", error.message);
  }
});

// Teardown dopo tutti i test
afterAll(async () => {
  logger.info("✅ Chiusura connessioni a MongoDB...");
  await mongoose.connection.close();
  logger.info("✅ MongoDB connection closed.");
  
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
  
  // Attendi brevemente per consentire la chiusura dei socket residui
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Rimuovi il blocco che forza l'uscita con process.exit
  // Se desideri loggare gli active handles per il debug, puoi farlo,
  // ma non chiamare process.exit.
  console.log("Active handles:", process._getActiveHandles());
});

// Cleanup dopo ogni test: rimuove documenti dalla collezione "knowledges" e pulisce Redis
afterEach(async () => {
  logger.info("🗑️ Pulizia del database di test...");
  try {
    await mongoose.connection.db.collection("knowledges").deleteMany({});
  } catch (error) {
    logger.error("❌ Errore durante la pulizia della collezione 'knowledges':", error.message);
  }
 // try {
 //   await redis.flushdb();
 // } catch (error) {
 //   logger.error("❌ Errore durante la pulizia di Redis:", error.message);
 // }
});

describe("Unified Access API Tests", () => {
  // Test di base (Sanity Check): Health Check
  test("GET /health - Controllo stato servizio", async () => {
    const response = await request(app).get("/.netlify/functions/unifiedAccess/health");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      status: "✅ Healthy",
      mongo: "Connected",
      redis: "Connected",
    });
  });

  // Test: Redis deve rispondere al PING
  test("Redis deve essere connesso", async () => {
    const redisPing = await redis.ping();
    expect(redisPing).toBe("PONG");
  });

  // Test principali API: Fetch da GitHub
  test("GET /fetch (GitHub) - Recupero file da GitHub", async () => {
    const response = await request(app).get("/.netlify/functions/unifiedAccess/fetch?source=github&file=README.md");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("file");
    expect(response.body).toHaveProperty("content");
  });

  // Test principali API: Fetch da MongoDB
  test("GET /fetch (MongoDB) - Recupero dati da MongoDB", async () => {
    const Knowledge = mongoose.models.Knowledge || mongoose.model(
      "Knowledge",
      new mongoose.Schema({
        key: { type: String, required: true, unique: true },
        value: mongoose.Schema.Types.Mixed,
      })
    );
    await Knowledge.create({ key: "test_key", value: "Test Value" });
    const response = await request(app).get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("key", "test_key");
    expect(response.body).toHaveProperty("value", "Test Value");
  });
});