require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../api/unifiedAccess"); // Importa l'app Express da unifiedAccess.js
const winston = require("winston");
const Redis = require("ioredis");
const { execSync } = require("child_process");

jest.setTimeout(30000); // Aumenta il timeout per operazioni asincrone

// 🚀 Logger Setup
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

// 🚀 Controllo processi attivi sulla porta 5000 (solo log, non interrompe l'esecuzione)
const checkActiveProcesses = () => {
  try {
    const runningProcesses = execSync("lsof -i :5000").toString();
    if (runningProcesses && runningProcesses.trim() !== "") {
      logger.warn("⚠️ Un altro processo è attivo sulla porta 5000. Questo potrebbe interferire con i test.");
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

// 🚀 Configurazione di Redis (con TLS e rejectUnauthorized impostato a false per Upstash)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});
redis.on("connect", () => logger.info("✅ Redis connesso con successo."));
redis.on("error", (err) => logger.error("❌ Errore connessione Redis:", err.message));

checkActiveProcesses();
checkEnvVariables();

let server;
beforeAll(async () => {
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

  // Avvio del server di test sulla porta 5000 usando l'app Express esportata da unifiedAccess.js
  server = app.listen(5000, () =>
    logger.info("🔹 Server di test avviato sulla porta 5000")
  );
});

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

describe("Unified Access API Tests", () => {
  test("GET /health - Controllo stato servizio", async () => {
    const response = await request(app).get("/.netlify/functions/unifiedAccess/health");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      status: "✅ Healthy",
      mongo: "Connected",
      redis: "Connected",
    });
  });

  test("Redis deve essere connesso", async () => {
    const redisPing = await redis.ping();
    expect(redisPing).toBe("PONG");
  });

  test("GET /fetch (GitHub) - Recupero file da GitHub", async () => {
    const response = await request(app).get("/.netlify/functions/unifiedAccess/fetch?source=github&file=README.md");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("file");
    expect(response.body).toHaveProperty("content");
  });

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