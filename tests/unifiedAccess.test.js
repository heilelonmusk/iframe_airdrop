require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { app, handler } = require("../api/unifiedAccess"); // ✅ Import server
const express = require("express");
const winston = require("winston");

jest.setTimeout(40000); // ⏳ Increased timeout for slow network requests

let server;

// 🚀 Winston Logger for Tests
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ✅ **Before all tests: Connect to DB and start server**
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
  }

  // ✅ **Start a local test server**
  const testApp = express();
  testApp.use("/.netlify/functions/unifiedAccess", handler);
  server = testApp.listen(5000, () => logger.info("🔹 Test server running on port 5000"));
});

// ✅ **After all tests: Close DB connection and shut down server**
afterAll(async () => {
  logger.info("✅ Closing MongoDB connection...");
  await mongoose.connection.close();
  server.close(() => logger.info("🔹 Test server closed."));
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
});

// ✅ **MongoDB Fetch Test**
test("GET /fetch (MongoDB) - should fetch data from MongoDB", async () => {
  const response = await request(server)
    .get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key")
    .expect(200);
  expect(response.body).toHaveProperty("key", "test_key");
  expect(response.body).toHaveProperty("value");
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

// ✅ **Cleanup: Remove Test Data from MongoDB**
afterEach(async () => {
  logger.info("🗑️ Cleaning up test database...");
  await mongoose.connection.db.collection("knowledges").deleteMany({});
});