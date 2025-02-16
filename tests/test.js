require("dotenv").config();
const { handler } = require("../api/server.js");
const winston = require("winston");
const { execSync } = require("child_process");

jest.setTimeout(15000); // Evita blocchi nei test lunghi

// 🚀 Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// 🚀 **Verifica processi attivi su Netlify**
const checkActiveProcesses = () => {
  try {
    const runningProcesses = execSync("lsof -i :5000 || lsof -i :8888").toString();
    if (runningProcesses) {
      logger.warn("⚠️ Esistono processi attivi sulla porta 5000 o 8888. Potrebbero interferire con i test.");
      process.exit(1);
    }
  } catch (error) {
    logger.info("✅ Nessun processo attivo sulle porte 5000/8888. Procediamo con i test.");
  }
};

// ✅ **Setup degli Eventi API**
describe("🔍 API Tests", () => {
  let healthEvent;
  let logQuestionEvent;

  beforeAll(async () => {
    checkActiveProcesses();
    logger.info("🛠 Setting up API tests...");

    healthEvent = {
      httpMethod: "GET",
      path: "/.netlify/functions/server/health",
    };

    logQuestionEvent = {
      httpMethod: "POST",
      path: "/.netlify/functions/server/logQuestion",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: "What is Helon?" }),
      isBase64Encoded: false,
    };

    logger.info("🔹 Checking server availability...");
    try {
      const healthResponse = await handler(healthEvent, {});
      if (!healthResponse || healthResponse.statusCode !== 200) {
        logger.error("❌ Server is not available. Health check failed.");
        process.exit(1);
      } else {
        logger.info("✅ Server is available. Proceeding with tests...");
      }
    } catch (error) {
      logger.error("❌ Server check failed:", error.message);
      process.exit(1);
    }
  });

  afterAll(() => {
    logger.info("✅ All tests completed.");
  });

  // ✅ **Health Check**
  test("🛠 Health check should return status 200", async () => {
    const response = await handler(healthEvent, {});
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("Healthy");
    logger.info("✅ Health check passed.");
  });

  // ✅ **logQuestion API Test**
  test("💬 logQuestion should return a valid response", async () => {
    const response = await handler(logQuestionEvent, {});
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);

    let data;
    try {
      data = JSON.parse(response.body);
    } catch (err) {
      logger.error("❌ Failed to parse response body as JSON:", response.body);
      throw err;
    }

    expect(data).toHaveProperty("answer");
    expect(typeof data.answer).toBe("string");
    logger.info("✅ logQuestion test passed.", data);
  });

  // ✅ **Test Invalid Input**
  test("❌ logQuestion should handle invalid input", async () => {
    const invalidEvent = {
      httpMethod: "POST",
      path: "/.netlify/functions/server/logQuestion",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      isBase64Encoded: false,
    };

    const response = await handler(invalidEvent, {});
    expect(response.statusCode).toBe(400);
    logger.warn("⚠️ logQuestion correctly handled missing input.");
  });
});