require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
// Importa sia l'app che il handler da unifiedAccess.js
const { app, handler } = require("../api/unifiedAccess");
const express = require("express");
const winston = require("winston");
const Redis = require("ioredis");
const { execSync } = require("child_process");

jest.setTimeout(30000); // Aumenta il timeout per operazioni asincrone

// 🚀 Configurazione del Logger con Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

// 🚀 Verifica processi attivi sulla porta 5000 (solo log, senza terminare l'esecuzione)
const checkActiveProcesses = () => {
  try {
    const runningProcesses = execSync("lsof -i :5000").toString();
    if (runningProcesses && runningProcesses.trim() !== "") {
      logger.warn("⚠️ Un altro processo è attivo sulla porta 5000. Questo potrebbe interferire con i test.");
      // Non terminare l'esecuzione
    }
  } catch (error) {
    logger.info("✅ Nessun processo attivo sulla porta 5000. Procediamo con i test.");
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

// 🚀 Configurazione di Redis
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false }, // Necessario per Upstash
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});
redis.on("connect", () => logger.info("✅ Redis connesso con successo."));
redis.on("error", (err) => logger.error("❌ Errore connessione Redis:", err.message));

// 📌 Helper per simulare richieste API (utilizzando direttamente il handler se necessario)
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

// Setup prima di tutti i test
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

  // Avvio di un server di test sulla porta 5000 usando l'app Express
  const testApp = express();
  testApp.use("/.netlify/functions/unifiedAccess", app);
  server = testApp.listen(5000, () =>
    logger.info("🔹 Server di test avviato sulla porta 5000")
  );
});

// Teardown dopo tutti i test
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

// Cleanup dopo ogni test: rimuove documenti dalla collezione "knowledges" e pulisce Redis
afterEach(async () => {
  logger.info("🗑️ Pulizia del database di test...");
  try {
    await mongoose.connection.db.collection("knowledges").deleteMany({});
  } catch (error) {
    logger.error("❌ Errore durante la pulizia della collezione 'knowledges':", error.message);
  }
  try {
    await redis.flushdb();
  } catch (error) {
    logger.error("❌ Errore durante la pulizia di Redis:", error.message);
  }
});

// Test di base (Sanity Check): Health Check
test("GET /health - Controllo stato servizio", async () => {
  const response = await simulateRequest("GET", "/health");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toMatchObject({
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
  const response = await simulateRequest("GET", "/fetch?source=github&file=README.md");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty("file");
  expect(body).toHaveProperty("content");
});

// Test principali API: Fetch da MongoDB
test("GET /fetch (MongoDB) - Recupero dati da MongoDB", async () => {
  // Crea un documento di test nella collezione "knowledges"
  const Knowledge = mongoose.models.Knowledge || mongoose.model(
    "Knowledge",
    new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: mongoose.Schema.Types.Mixed,
    })
  );
  await Knowledge.create({ key: "test_key", value: "Test Value" });

  const response = await simulateRequest("GET", "/fetch?source=mongodb&query=test_key");
  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty("key", "test_key");
  expect(body).toHaveProperty("value", "Test Value");
});