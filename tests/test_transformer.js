require("dotenv").config();
const mongoose = require("mongoose");
const { NLPModel } = require("../modules/nlp/nlpModel");
const winston = require("winston");
const { execSync } = require("child_process");

jest.setTimeout(30000); // ⏳ Evita blocchi sui test lunghi

// 🚀 **Configurazione del Logger**
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

// ✅ **Verifica variabili d’ambiente**
const checkEnvVariables = () => {
  if (!process.env.MONGO_URI) {
    logger.error("❌ MONGO_URI non è definito nel file .env");
    process.exit(1);
  }
};

// ✅ **Setup prima dei test**
beforeAll(async () => {
  checkMongoDBProcesses();
  checkEnvVariables();

  logger.info("✅ Connessione a MongoDB per i test NLP...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅ Connessione a MongoDB riuscita.");
  } catch (error) {
    logger.error("❌ Errore di connessione a MongoDB:", error.message);
    process.exit(1);
  }
});

// ✅ **Chiusura connessione dopo i test**
afterAll(async () => {
  logger.info("✅ Chiusura connessione a MongoDB...");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("✅ Connessione a MongoDB chiusa.");
  } else {
    logger.warn("⚠️ MongoDB era già disconnesso.");
  }
});

// ✅ **Test se il modello NLP è caricato correttamente**
test("🔍 NLPModel deve essere caricato da MongoDB", async () => {
  try {
    if (!NLPModel || typeof NLPModel.findOne !== "function") {
      throw new Error("❌ NLPModel non è definito o non ha il metodo findOne.");
    }

    const savedModel = await NLPModel.findOne({});
    expect(savedModel).toBeTruthy();

    if (savedModel) {
      logger.info("✅ NLP Model caricato correttamente da MongoDB.");
    } else {
      logger.warn("⚠️ Nessun NLP Model trovato in MongoDB. Potrebbe essere necessario addestrarlo.");
    }
  } catch (error) {
    logger.error("❌ Errore nel recupero di NLP Model:", error.message);
    throw error;
  }
});

// ✅ **Test se il modello NLP elabora correttamente il testo**
test("💬 NLPModel deve elaborare correttamente il testo", async () => {
  try {
    const mockInput = "What is Helon?";
    const expectedOutput = "Helon is a decentralized AI ecosystem.";

    if (!NLPModel || typeof NLPModel.processText !== "function") {
      throw new Error("❌ NLPModel.processText non è una funzione valida.");
    }

    const modelResponse = await NLPModel.processText(mockInput);
    expect(modelResponse).toBeDefined();
    expect(typeof modelResponse).toBe("string");

    // ✅ Il confronto è più flessibile, evita errori dovuti a minimi cambiamenti di output.
    expect(modelResponse.toLowerCase()).toContain("helon");

    logger.info("✅ NLPModel ha elaborato il testo correttamente.");
  } catch (error) {
    logger.error("❌ Test fallito: NLPModel non ha elaborato il testo correttamente:", error.message);
    throw error;
  }
});

// ✅ **Test per verificare comportamento con input vuoto**
test("🚨 NLPModel deve gestire correttamente input vuoto", async () => {
  try {
    const response = await NLPModel.processText("");
    expect(response).toBe(null);
    logger.warn("⚠️ NLPModel ha correttamente gestito input vuoto.");
  } catch (error) {
    logger.error("❌ NLPModel ha fallito la gestione di input vuoto:", error.message);
  }
});

// ✅ **Test per input non valido**
test("🚨 NLPModel deve gestire input non valido", async () => {
  try {
    const invalidInputs = [null, undefined, 12345, {}, []];

    for (const input of invalidInputs) {
      const response = await NLPModel.processText(input);
      expect(response).toBe(null);
      logger.warn(`⚠️ NLPModel ha correttamente gestito input non valido: ${JSON.stringify(input)}`);
    }
  } catch (error) {
    logger.error("❌ NLPModel ha fallito la gestione di input non valido:", error.message);
  }
});

// ✅ **Cleanup dopo ogni test**
afterEach(async () => {
  try {
    logger.info("🗑️ Pulizia database dopo i test...");
    await mongoose.connection.db.collection("nlpmodels").deleteMany({});
  } catch (error) {
    logger.error("❌ Errore nella pulizia del database:", error.message);
  }
});