const mongoose = require('mongoose');
const path = require("path");
const { logger } = require(path.resolve(__dirname, "../logging/logger"));
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ Funzione per processare il testo con il modello NLP
async function processText(text) {
  if (!text) throw new Error("Input text is required");

  // Assicura che il modello sia caricato
  const savedModel = await loadNLPModel();
  if (!savedModel) {
    throw new Error("❌ No NLP Model found in database. Train the model first.");
  }

  manager.import(savedModel); // Carica il modello salvato
  const response = await manager.process("en", text);
  return response.answer || "Unknown intent";
}

// ✅ Carica il modello NLP dal database
async function loadNLPModel() {
  try {
    const savedModel = await NLPModel.findOne({});
    console.log("🔍 NLPModel loaded:", savedModel);
    if (savedModel) {
      logger.info("✅ NLP Model loaded from MongoDB");
      return savedModel.modelData;
    }
    logger.warn("⚠️ No NLP Model found in database. Training required.");
    return null;
  } catch (error) {
    logger.error("❌ Error loading NLP model:", error.message);
    throw error;
  }
}

// ✅ Funzione per salvare il modello NLP nel database
async function saveNLPModel(modelData) {
  try {
    await NLPModel.updateOne({}, { modelData }, { upsert: true });
    logger.info("✅ NLP Model saved in MongoDB");
  } catch (error) {
    logger.error("❌ Error saving NLP model:", error.message);
    throw error;
  }
}

// ✅ Funzione per allenare e salvare il modello NLP
async function trainAndSaveNLP() {
  manager.addDocument("en", "hello", "greeting");
  await manager.train();

  const modelData = manager.export();
  await saveNLPModel(modelData);

  logger.info("✅ New NLP Model trained and saved!");
}

// ❗❗ Chiamata a trainAndSaveNLP() solo se il modello non esiste già
(async () => {
  try {
    if (process.env.NODE_ENV !== "test") { // Evita di eseguirlo nei test
      const model = await loadNLPModel();
      if (!model) {
        await trainAndSaveNLP();
      }
    }
  } catch (error) {
    logger.error("❌ Error initializing NLP model:", error.message);
  }
  (async () => {
    if (process.env.NODE_ENV !== "test") { // Evita di eseguirlo nei test
      const model = await loadNLPModel();
      if (!model) {
        await trainAndSaveNLP();
      }
    }
  })();
})();

module.exports = { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP, NLPModelSchema, processText };