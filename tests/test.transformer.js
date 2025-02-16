require("dotenv").config();
const mongoose = require("mongoose");
const { NLPModel } = require("../modules/nlp/nlpModel");
const winston = require("winston");
const { execSync } = require("child_process");
const { logger } = require("../modules/logging/logger");

jest.setTimeout(30000); // Evita blocchi nei test lunghi

// 🚀 Configurazione del Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// 🚀 Verifica se ci sono processi MongoDB attivi sulla porta 27017
const checkMongoDBProcesses = () => {
  try {
    const runningProcesses = execSync("lsof -i :27017 || pgrep mongod").toString();
    if (runningProcesses && runningProcesses.trim() !== "") {
      logger.warn("⚠️ MongoDB è già in esecuzione sulla porta 27017. Potrebbe interferire con i test.");
      process.exit(1);
    }
  } catch (error) {
    logger.info("✅ Nessun processo MongoDB attivo. Procediamo con i test.");
  }
};

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
  checkMongoDBProcesses();
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
  logger.info("✅ Closing MongoDB connection...");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed.");
  } else {
    logger.warn("⚠️ MongoDB was already disconnected.");
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
  try {
    const mockInput = "What is Helon?";
    // L'output atteso deve contenere il termine "helon" (case-insensitive)
    if (!NLPModel || typeof NLPModel.processText !== "function") {
      throw new Error("❌ NLPModel.processText is not a function");
    }

    const modelResponse = await NLPModel.processText(mockInput);
    expect(modelResponse).toBeDefined();
    expect(typeof modelResponse).toBe("string");
    expect(modelResponse.toLowerCase()).toContain("helon");

    logger.info("✅ NLPModel processed text correctly.");
  } catch (error) {
    logger.error("❌ NLPModel processing test failed:", error.message);
    throw error;
  }
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

// Cleanup: Rimozione dati di test dalla collezione "nlpmodels" dopo ogni test
afterEach(async () => {
  try {
    logger.info("🗑️ Cleaning up test database...");
    await mongoose.connection.db.collection("nlpmodels").deleteMany({});
  } catch (error) {
    logger.error("❌ Error cleaning up test database:", error.message);
  }
});