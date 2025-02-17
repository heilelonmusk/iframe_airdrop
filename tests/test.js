require("dotenv").config();
const { app, handler, redis} = require("../api/server.js");
//const winston = require("winston");
const { execSync } = require("child_process");
const mongoose = require("mongoose");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");
//logger.error("This is an error message");
const { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP, NLPModelSchema, processText } = require('../modules/nlp/nlpModel');

jest.setTimeout(20000); // Evita blocchi nei test lunghi

//Configurazione del Logger con un formato leggermente più conciso
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp({ format: "HH:mm:ss" }),
//    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
//  ),
//  transports: [new winston.transports.Console()],
//});

if (!process.env.CI && !process.env.NETLIFY && process.env.NODE_ENV !== "production") {
  checkActiveProcesses();
}

// Verifica processi attivi sulle porte 5000 o 8889
const checkActiveProcesses = () => {
  try {
    // Esegue il comando per controllare processi attivi (nota: questo potrebbe non funzionare su tutti i sistemi)
    const running = execSync("lsof -i :5000 || lsof -i :8889").toString();
    if (running && running.trim() !== "") {
      logger.warn("⚠️ Sono attivi processi sulla porta 5000 o 8889. Potrebbero interferire con i test.");
      // Non terminiamo l'esecuzione, ma solo logghiamo l'avviso.
    }
  } catch (error) {
    // Se il comando fallisce (ad esempio, se non ci sono processi o se il comando non esiste), logghiamo un messaggio informativo
    logger.info("✅ Nessun processo attivo rilevato sulle porte 5000/8889.");
  }
};

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
    checkActiveProcesses();
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

  (async () => {
    try {
        await connectMongoDB();
        console.log("✅ Test MongoDB connection successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
})();
  

});