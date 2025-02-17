require("dotenv").config();
const { app, handler, redis} = require("../api/server.js");
//const winston = require("winston");
const { execSync } = require("child_process");
const mongoose = require("mongoose");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");
//logger.error("This is an error message");
const { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP, NLPModelSchema, processText } = require('../modules/nlp/nlpModel');
const { connectMongoDB } = require("../api/server");
jest.setTimeout(20000); // Evita blocchi nei test lunghi

(async () => {
if (!nlpInstance)
  console.warn("⚠️ No existing NLP Model found. Training a new one...");
  const newModel = await trainNLPModel();
  await newModel.save();

});

logger.info(`🔹 Fetching from GitHub: https://api.github.com/repos/${process.env.MY_GITHUB_OWNER}/${process.env.MY_GITHUB_REPO}/README.md`);
//Configurazione del Logger con un formato leggermente più conciso
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp({ format: "HH:mm:ss" }),
//    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
//  ),
//  transports: [new winston.transports.Console()],
//});

// Verifica delle variabili d'ambiente richieste
const checkEnvVariables = () => {
  const requiredEnvVars = ["MY_GITHUB_OWNER", "MY_GITHUB_REPO", "MY_GITHUB_TOKEN"];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.error(`❌ Variabile d'ambiente mancante: ${envVar}`);
      process.exit(1);
    }
  });
};

describe("🔍 API Tests", () => {
  let healthEvent;
  let logQuestionEvent;

  beforeAll(async () => {
    checkEnvVariables();
    logger.info("🛠 Setting up API tests...");

    // Definizione degli eventi per i test
    healthEvent = {
      httpMethod: "GET",
      path: "/.netlify/functions/server/health",
    };

    logQuestionEvent = {
      httpMethod: "POST",
      path: "/.netlify/functions/server/logQuestion",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What is Helon?" }),
      isBase64Encoded: false,
    };

    logger.info("🔹 Checking server availability...");
    try {
      const healthResponse = await handler(healthEvent, {});
      if (!healthResponse || healthResponse.statusCode !== 200) {
        logger.error("❌ Server non disponibile. Health check fallito.");
        process.exit(1);
      } else {
        logger.info("✅ Server disponibile. Procediamo con i test...");
      }
    } catch (error) {
      logger.error("❌ Server check fallito:", error.message);
      process.exit(1);
    }
  });

  // Health Check Test
  test("🛠 Health check should return status 200", async () => {
    const response = await handler(healthEvent, {});
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("Healthy");
    logger.info("✅ Health check passed.");
  });

  // logQuestion API Test
  test("💬 logQuestion should return a valid response", async () => {
    const response = await handler(logQuestionEvent, {});
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);

    let data;
    try {
      data = JSON.parse(response.body);
    } catch (err) {
      logger.error("❌ Errore nel parsing del body JSON:", response.body);
      throw err;
    }
    expect(data).toHaveProperty("answer");
    expect(typeof data.answer).toBe("string");
    logger.info("✅ logQuestion test passed.", data);
  });

  // Test per input invalido
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
    logger.warn("⚠️ logQuestion ha gestito correttamente l'input mancante.");
  });

  // Test per endpoint inesistente
  test("❌ Unknown endpoint should return 404", async () => {
    const unknownEvent = {
      httpMethod: "GET",
      path: "/.netlify/functions/server/unknownEndpoint",
    };

    const response = await handler(unknownEvent, {});
    expect(response.statusCode).toBe(404);
    logger.warn("⚠️ Endpoint sconosciuto ha restituito 404 come previsto.");
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
        await redis.quit();
        logger.info("🔹 Connessione Redis chiusa.");
      } catch (quitError) {
        logger.warn("⚠️ Errore durante la chiusura della connessione Redis, forzando disconnect:", quitError.message);
        redis.disconnect();
      }
    }
  });
});