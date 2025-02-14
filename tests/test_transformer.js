require("dotenv").config();
const mongoose = require("mongoose");
const { NLPModel } = require("../api/transformer"); // Import transformer model
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
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:", error.message);
  }
});

// ✅ **After all tests: Close MongoDB Connection**
afterAll(async () => {
  logger.info("✅ Closing MongoDB connection...");
  await mongoose.connection.close();
});

// ✅ **Test if Transformer Model Loads Correctly**
test("NLPModel should load from MongoDB", async () => {
  const savedModel = await NLPModel.findOne({});
  if (savedModel) {
    logger.info("✅ NLP Model loaded from MongoDB");
  } else {
    logger.warn("⚠️ No NLP Model found in MongoDB. Training required.");
  }
  expect(savedModel).toBeTruthy();
});

// ✅ **Test if Transformer Model Processes Text Correctly**
test("NLPModel should process text correctly", async () => {
  const mockInput = "What is Helon?";
  const mockOutput = "Helon is a decentralized AI ecosystem.";

  const modelResponse = await NLPModel.processText(mockInput);
  expect(modelResponse).toBeDefined();
  expect(modelResponse).toMatch(mockOutput);
});

// ✅ **Cleanup: Remove Test Data from MongoDB**
afterEach(async () => {
  logger.info("🗑️ Cleaning up test database...");
  await mongoose.connection.db.collection("nlpmodels").deleteMany({});
});