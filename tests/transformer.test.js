require("dotenv").config();
const mongoose = require("mongoose");
const { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP, NLPModelSchema} = require('../modules/nlp/nlpModel');
const { execSync } = require("child_process");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");
const redis = require("../config/redis")
const { processText } = require("../modules/nlp/nlpModel");

jest.setTimeout(30000); // Evita blocchi nei test lunghi

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

let server; // Variabile per gestire il server

beforeAll(() => {
  const app = require("../api/server"); // Importa il server Express
  server = app.listen(5000, () => {
    logger.info("🚀 Test Server running on port 5000");
  });
});

// Setup prima di tutti i test
beforeAll(async () => {
  checkEnvVariables();

  logger.info("✅ Connecting to MongoDB for Transformer Tests...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ MongoDB Connected Successfully");

    // Aggiungi i listener per il debug della connessione:
    mongoose.connection.on("error", (err) => logger.error("MongoDB error:", err));
    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected."));
    mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected!"));
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
});

// Teardown dopo tutti i test
afterAll(async () => {
  // Chiude la connessione a MongoDB
  await mongoose.connection.close();
  // Chiude la connessione Redis
  await redis.quit();
  // Se necessario, forza la disconnessione
  redis.disconnect();
  // (Opzionale) Attendi brevemente per consentire la chiusura dei socket residui
  await new Promise(resolve => setTimeout(resolve, 1000));
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
    const response = await NLPModel.processText("");
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
    const response = await NLPModel.processText(null);
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
    const response = await NLPModel.processText(undefined);
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