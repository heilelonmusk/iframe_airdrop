require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { app, handler } = require("../api/unifiedAccess"); // Import server
const express = require("express");
const winston = require("winston");
const Redis = require("ioredis");

jest.setTimeout(30000); // Increase timeout for async operations

let server;
const redis = new Redis(process.env.REDIS_URL, {
  enableOfflineQueue: false, // Ensures stability in testing
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// 🚀 Winston Logger for Tests
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ✅ **Before all tests: Connect to DB, Redis and start server**
beforeAll(async () => {
  logger.info("✅ Connecting to Test Database...");
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

  try {
    await redis.ping();
    logger.info("✅ Redis Connected Successfully");
  } catch (error) {
    logger.warn("⚠️ Redis Connection Failed:", error.message);
  }

  // ✅ **Start a local test server**
  const testApp = express();
  testApp.use("/.netlify/functions/unifiedAccess", handler);
  try {
    server = testApp.listen(5000, () => logger.info("🔹 Test server running on port 5000"));
  } catch (error) {
    logger.error("❌ Failed to start test server:", error.message);
    process.exit(1);
  }
});

// ✅ **After all tests: Close DB connection and shut down server**
afterAll(async () => {
  logger.info("✅ Closing MongoDB and Redis connections...");
  await mongoose.connection.close();
  await redis.quit();
  if (server && server.address()) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info("🔹 Test server closed.");
  }
});

// ✅ **Health Check Test**
test("GET /health - should return service status", async () => {
  const response = await request(server).get("/.netlify/functions/unifiedAccess/health").expect(200);
  expect(response.body).toMatchObject({ status: "✅ Healthy", mongo: "Connected", redis: "Connected" });
});

// ✅ **GitHub Fetch Test**
test("GET /fetch (GitHub) - should fetch a file from GitHub", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=github&file=README.md")
    .expect(200);
  expect(response.body).toHaveProperty("file");
  expect(response.body).toHaveProperty("content");
  expect(typeof response.body.content).toBe("string");
});

// ✅ **MongoDB Fetch Test**
test("GET /fetch (MongoDB) - should fetch data from MongoDB", async () => {
  // Insert test data first
  await mongoose.connection.db.collection("knowledges").insertOne({ key: "test_key", value: "Test Value" });

  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key")
    .expect(200);
  
  expect(response.body).toHaveProperty("key", "test_key");
  expect(response.body).toHaveProperty("value", "Test Value");
});

// ✅ **Netlify Fetch Test (File Not Found)**
test("GET /fetch (Netlify) - should return 404 if file not found", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=netlify&file=nonexistent.json")
    .expect(404);
  expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});

// ✅ **Store Data in MongoDB**
test("POST /store - should store data in MongoDB", async () => {
  const response = await request(server)
    .post("/.netlify/functions/unifiedAccess/store")
    .send({ key: "test_key", value: "Hello MongoDB!" })
    .expect(200);
  
  expect(response.body).toHaveProperty("message", "✅ Data stored successfully");
});

// ✅ **Ensure Stored Data is Available**
test("GET /fetch after POST /store - should retrieve stored data", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key")
    .expect(200);
  
  expect(response.body).toHaveProperty("key", "test_key");
  expect(response.body).toHaveProperty("value", "Hello MongoDB!");
});

// ✅ **GitHub File Download**
test("GET /download (GitHub) - should download a file", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/download?source=github&file=README.md")
    .expect(200);
  
  // ✅ Accept both Markdown and Octet-stream content types
  const contentType = response.headers["content-type"];
  expect(contentType).toMatch(/text\/markdown|application\/octet-stream/);
});

// ✅ **Netlify File Download (File Not Found)**
test("GET /download (Netlify) - should return 404 if file not found", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/download?source=netlify&file=nonexistent.json")
    .expect(404);
  expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});

// ✅ **Invalid Source Parameter Handling**
test("GET /fetch - should return 400 for invalid source", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=invalidSource")
    .expect(400);
  expect(response.body).toHaveProperty("error", "Invalid source parameter.");
});

// ✅ **Cleanup: Remove Test Data from MongoDB and Redis**
afterEach(async () => {
  logger.info("🗑️ Cleaning up test database and Redis cache...");
  await mongoose.connection.db.collection("knowledges").deleteMany({});
  await redis.flushdb();
});