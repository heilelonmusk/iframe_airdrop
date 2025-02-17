let server = null;
require("dotenv").config();
const { app, handler } = require("../api/unifiedAccess.js");
const request = require("supertest");
const mongoose = require("mongoose");
const redis = require("../config/redis");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");

logger.info(`🔹 Fetching from GitHub: https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/README.md`);

jest.setTimeout(30000); // Aumenta il timeout per operazioni asincrone

(async () => {
  if (!nlpInstance)
    console.warn("⚠️ No existing NLP Model found. Training a new one...");
    const newModel = await trainNLPModel();
    await newModel.save();
  
  });

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

if (!process.env.NETLIFY) checkEnvVariables();

// ✅ Setup prima di tutti i test
beforeAll(async () => {
  logger.info("✅ Connessione al database di test...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ Connessione a MongoDB riuscita.");
    
    // Assegna un modello NLP a req.nlpInstance per evitare errori nei test
    const { NLPModel, trainAndSaveNLP } = require("../modules/nlp/nlpModel");
    let model = await NLPModel.findOne();
    if (!model) {
      await trainAndSaveNLP();
      model = await NLPModel.findOne();
    }
    global.nlpModelCache = model;

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

  // Avvio del server se non è già in esecuzione
  if (!process.env.NETLIFY) {
    server = app.listen(0, () => {
      logger.info(`🚀 Test Server running on port ${server.address().port}`);
    });
  }
});

// ✅ Cleanup prima di ogni test
beforeEach(async () => {
  logger.info("🗑️ Pulizia del database di test...");
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (error) {
    logger.warn("⚠️ Errore nella pulizia del database:", error.message);
  }
});



// ✅ Suite di test API
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
    const repoUrl = `https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/contents/README.md`;
    logger.info(`🔹 Test Fetch da GitHub: ${repoUrl}`);

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

// ✅ Teardown dopo tutti i test
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
      redis.disconnect();
    }
  }


  if (server) {
    server.close(() => {
      logger.info("🛑 Express server closed after tests.");
    });
  }
});

});