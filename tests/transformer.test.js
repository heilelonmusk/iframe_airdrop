let server=null;
require("dotenv").config();
const mongoose = require("mongoose");
const { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP, NLPModelSchema, nlprocessText} = require('../modules/nlp/nlpModel');
const { execSync } = require("child_process");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");
const { redis, quitRedis, cacheMiddleware } = require("../config/redis");
const { processText } = require("../modules/nlp/nlpModel");

jest.setTimeout(30000); // Evita blocchi nei test lunghi

(async () => {
  if (!nlpInstance)
    console.warn("⚠️ No existing NLP Model found. Training a new one...");
    const newModel = await trainNLPModel();
    await newModel.save();
  
  });

// 🚀 Configurazione del Logger
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
//  ),
//  transports: [new winston.transports.Console()],
//});

//if (!process.env.CI && !process.env.NETLIFY && process.env.NODE_ENV !== "production") {
//  console.log("ℹ️ Skipping MongoDB process check in production.");
//}

logger.info(`🔹 Fetching from GitHub: https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/README.md`);


// ✅ Verifica delle variabili d’ambiente
const checkEnvVariables = () => {
  const requiredEnvVars = ["MONGO_URI"];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

// Setup prima di tutti i test
beforeAll(async () => {
  checkEnvVariables();

    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
        }
        logger.info("✅ Connessione a MongoDB riuscita.");
    } catch (error) {
        logger.error("❌ Errore nella connessione a MongoDB:", error.message);
    }
});

afterEach(async () => {
    try {
        if (mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
            logger.info("🗑️ Database di test pulito con successo.");
        }
    } catch (error) {
        logger.warn("⚠️ Errore nella pulizia del database, procediamo comunque.");
    }
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
      await quitRedis();
      logger.info("🔹 Connessione Redis chiusa.");
    } catch (quitError) {
      logger.warn("⚠️ Errore durante la chiusura della connessione Redis, forzando disconnect:", quitError.message);
    }
  }
});


// Test: Verifica che il modello NLP venga caricato da MongoDB
test("🔍 NLPModel should load from MongoDB", async () => {
  try {
    if (!NLPModel || typeof NLPModel.findOne !== "function") {
      throw new Error("❌ NLPModel is not defined or does not have findOne method.");
    }

    const savedModel = await NLPModel.findOne({});
    expect(savedModel).toBeTruthy();

    if (savedModel) {
      logger.info("✅ NLP Model loaded from MongoDB");
    } else {
      logger.warn("⚠️ No NLP Model found in MongoDB. Training required.");
    }
  } catch (error) {
    logger.error("❌ Error retrieving NLP Model:", error.message);
    throw error;
  }
});

// Test: Verifica che il modello NLP elabori correttamente il testo
test("💬 NLPModel should process text correctly", async () => {
  const mockInput = "What is Helon?";

  const nlpInstance = await NLPModel.findOne();
  if (!nlpInstance) throw new Error("❌ No NLP Model found in database. Train the model first.");

  const modelResponse = await nlpInstance.processText(mockInput);
  
  expect(modelResponse).toBeDefined();
  expect(typeof modelResponse).toBe("string");
  expect(modelResponse.toLowerCase()).toContain("helon");

  logger.info("✅ NLPModel processed text correctly.");
});

// Test: Verifica comportamento con input vuoto
test("🚨 NLPModel should return an error for empty input", async () => {
  try {
    const response = await nlprocessText("");
    expect(response).toBe(null);
    logger.warn("⚠️ NLPModel correctly handled empty input.");
  } catch (error) {
    logger.error("❌ NLPModel failed on empty input:", error.message);
    throw error;
  }
});

// Test: Verifica comportamento con input null
test("🚨 NLPModel should return an error for null input", async () => {
  try {
    const response = await nlprocessText(null);
    expect(response).toBe(null);
    logger.warn("⚠️ NLPModel correctly handled null input.");
  } catch (error) {
    logger.error("❌ NLPModel failed on null input:", error.message);
    throw error;
  }
});

// Test: Verifica comportamento con input undefined
test("🚨 NLPModel should return an error for undefined input", async () => {
  try {
    const response = await nlprocessText(undefined);
    expect(response).toBe(null);
    logger.warn("⚠️ NLPModel correctly handled undefined input.");
  } catch (error) {
    logger.error("❌ NLPModel failed on undefined input:", error.message);
    throw error;
  }
});

// Cleanup: Rimozione del database di test dopo ogni test
afterEach(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⚠️ MongoDB non è connesso. Tentiamo di riconnetterci...");
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      logger.info("🗑️ Database di test pulito con successo.");
    } else {
      logger.warn("⚠️ Connessione a MongoDB presente, ma 'db' non è definito.");
    }
  } catch (error) {
    logger.warn("⚠️ Errore nella pulizia del database, procediamo comunque:", error.message);
  }
});