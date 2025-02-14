require("dotenv").config();
const mongoose = require("mongoose");
const { NLPModel } = require("../modules/nlp/nlpModel"); // Fixed import path
const winston = require("winston");

// 🚀 Winston Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

jest.setTimeout(30000); // Increase timeout for async operations

// ✅ **Before all tests: Connect to MongoDB**
beforeAll(async () => {
  logger.info("✅ Connecting to MongoDB for Transformer Tests...");
  try {
    if (!process.env.MONGO_URI) throw new Error("❌ MONGO_URI not set in .env file.");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Exit to prevent invalid tests
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

// ✅ **Test if Transformer Model Loads Correctly**
test("NLPModel should load from MongoDB", async () => {
  try {
    const savedModel = await NLPModel.findOne({});
    expect(savedModel).toBeTruthy();
    if (savedModel) {
      logger.info("✅ NLP Model loaded from MongoDB");
    } else {
      logger.warn("⚠️ No NLP Model found in MongoDB. Training required.");
    }
  } catch (error) {
    logger.error("❌ Error retrieving NLP Model:", error.message);
    throw error; // Ensures test fails properly
  }
});

// ✅ **Test if Transformer Model Processes Text Correctly**
test("NLPModel should process text correctly", async () => {
  try {
    const mockInput = "What is Helon?";
    const mockOutput = "Helon is a decentralized AI ecosystem.";

    if (typeof NLPModel.processText !== "function") {
      throw new Error("❌ NLPModel.processText is not a function");
    }

    const modelResponse = await NLPModel.processText(mockInput);
    expect(modelResponse).toBeDefined();
    expect(modelResponse).toMatch(mockOutput);
  } catch (error) {
    logger.error("❌ NLPModel processing test failed:", error.message);
    throw error;
  }
});

// ✅ **Cleanup: Remove Test Data from MongoDB**
afterEach(async () => {
  try {
    logger.info("🗑️ Cleaning up test database...");
    await mongoose.connection.db.collection("nlpmodels").deleteMany({});
  } catch (error) {
    logger.error("❌ Error cleaning up test database:", error.message);
  }
});