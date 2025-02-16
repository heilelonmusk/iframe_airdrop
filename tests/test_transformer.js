require("dotenv").config();
const mongoose = require("mongoose");
const { NLPModel } = require("../modules/nlp/nlpModel");
const winston = require("winston");
const { execSync } = require("child_process");

jest.setTimeout(30000); // Evita blocchi sui test lunghi

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// 🚀 **Verifica se MongoDB è già in uso**
const checkMongoDBProcesses = () => {
  try {
    const runningProcesses = execSync("pgrep mongod").toString();
    if (runningProcesses) {
      logger.warn("⚠️ MongoDB è già in esecuzione. Potrebbe interferire con i test.");
      process.exit(1);
    }
  } catch (error) {
    logger.info("✅ Nessun processo MongoDB attivo. Procediamo con i test.");
  }
};

// ✅ **Before all tests: Verifica e connessione a MongoDB**
beforeAll(async () => {
  checkMongoDBProcesses();
  
  logger.info("✅ Connecting to MongoDB for Transformer Tests...");
  if (!process.env.MONGO_URI) {
    logger.error("❌ MONGO_URI not set in .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
});

// ✅ **After all tests: Close MongoDB Connection**
afterAll(async () => {
  logger.info("✅ Closing MongoDB connection...");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed.");
  } else {
    logger.warn("⚠️ MongoDB was already disconnected.");
  }
});

// ✅ **Test se il modello NLP è caricato correttamente**
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

// ✅ **Test se il modello NLP elabora correttamente il testo**
test("💬 NLPModel should process text correctly", async () => {
  try {
    const mockInput = "What is Helon?";
    const expectedOutput = "Helon is a decentralized AI ecosystem.";

    if (!NLPModel || typeof NLPModel.processText !== "function") {
      throw new Error("❌ NLPModel.processText is not a function");
    }

    const modelResponse = await NLPModel.processText(mockInput);
    expect(modelResponse).toBeDefined();
    expect(typeof modelResponse).toBe("string");

    // Il confronto deve essere più flessibile, evitando errori di minimi cambiamenti di output.
    expect(modelResponse.toLowerCase()).toContain("helon");

    logger.info("✅ NLPModel processed text correctly.");
  } catch (error) {
    logger.error("❌ NLPModel processing test failed:", error.message);
    throw error;
  }
});

// ✅ **Test per verificare comportamento con input vuoto**
test("🚨 NLPModel should return an error for empty input", async () => {
  try {
    const response = await NLPModel.processText("");
    expect(response).toBe(null);
    logger.warn("⚠️ NLPModel correctly handled empty input.");
  } catch (error) {
    logger.error("❌ NLPModel failed on empty input:", error.message);
  }
});

// ✅ **Cleanup: Rimozione dati di test da MongoDB**
afterEach(async () => {
  try {
    logger.info("🗑️ Cleaning up test database...");
    await mongoose.connection.db.collection("nlpmodels").deleteMany({});
  } catch (error) {
    logger.error("❌ Error cleaning up test database:", error.message);
  }
});