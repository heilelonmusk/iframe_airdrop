require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { handler } = require("../api/unifiedAccess"); // Import server handler
const express = require("express");
const winston = require("winston");
const Redis = require("ioredis");
const { execSync } = require("child_process");

jest.setTimeout(30000); // Increase timeout for async operations

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// 🚀 **Verifica processi attivi prima dei test**
const checkActiveProcesses = () => {
  try {
    const runningProcesses = execSync("lsof -i :5000").toString();
    if (runningProcesses) {
      logger.warn("⚠️ Un altro processo è attivo sulla porta 5000. Interrompiamolo per evitare conflitti.");
      process.exit(1);
    }
  } catch (error) {
    logger.info("✅ Nessun processo attivo sulla porta 5000. Procediamo con i test.");
  }
};

// 🚀 **Verifica delle Variabili d'Ambiente**
const checkEnvVariables = () => {
  const requiredEnvVars = ["MONGO_URI", "REDIS_URL", "MY_GITHUB_OWNER", "MY_GITHUB_REPO", "MY_GITHUB_TOKEN"];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

// 🚀 **Connessione a Redis con Strategia di Retry**
let redis;
try {
  redis = new Redis(process.env.REDIS_URL, {
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });
} catch (error) {
  logger.warn("⚠️ Connessione Redis fallita. Simuliamo Redis per i test.");
  redis = { ping: async () => "PONG", get: async () => null, setex: async () => null, del: async () => null };
}

// 📌 **Helper per simulare richieste API**
const simulateRequest = async (method, path, body = null) => {
  const event = {
    httpMethod: method,
    path: `/.netlify/functions/unifiedAccess${path}`,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
  };
  return await handler(event, {});
};

// ✅ **Setup prima di tutti i test**
let server;
beforeAll(async () => {
  checkActiveProcesses();
  checkEnvVariables();

  logger.info("✅ Connessione al database di test...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ Connessione a MongoDB riuscita.");
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

  // ✅ **Avvio server di test**
  const testApp = express();
  testApp.use("/.netlify/functions/unifiedAccess", handler);
  server = testApp.listen(5000, () => logger.info("🔹 Server di test avviato sulla porta 5000"));
});

// ✅ **Teardown dopo tutti i test**
afterAll(async () => {
  logger.info("✅ Chiusura connessioni a MongoDB e Redis...");
  await mongoose.connection.close();
  await redis.quit();
  if (server && server.address()) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info("🔹 Server di test chiuso.");
  }
});

// ✅ **Test di base (Sanity Check)**
test("GET /health - Controllo stato servizio", async () => {
  const response = await simulateRequest("GET", "/health");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toMatchObject({ status: "✅ Healthy", mongo: "Connected", redis: "Connected" });
});

// ✅ **Test connessione Redis**
test("Redis deve essere connesso", async () => {
  const redisPing = await redis.ping();
  expect(redisPing).toBe("PONG");
});

// ✅ **Test principali API**
test("GET /fetch (GitHub) - Recupero file da GitHub", async () => {
  const response = await simulateRequest("GET", "/fetch?source=github&file=README.md");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty("file");
  expect(body).toHaveProperty("content");
});

test("GET /fetch (MongoDB) - Recupero dati da MongoDB", async () => {
  const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
  }));

  await Knowledge.create({ key: "test_key", value: "Test Value" });

  const response = await simulateRequest("GET", "/fetch?source=mongodb&query=test_key");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty("key", "test_key");
  expect(body).toHaveProperty("value", "Test Value");
});

// ✅ **Cleanup dopo ogni test**
afterEach(async () => {
  logger.info("🗑️ Pulizia del database di test...");
  await mongoose.connection.db.collection("knowledges").deleteMany({});
  await redis.flushdb();
});