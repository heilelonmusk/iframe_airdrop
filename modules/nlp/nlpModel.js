const mongoose = require('mongoose');
const path = require("path");
const { logger } = require(path.resolve(__dirname, "../logging/logger"));

const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

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
  const { NlpManager } = require('node-nlp');
  const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });

  manager.addDocument("en", "hello", "greeting");
  await manager.train();

  const modelData = manager.export();
  await saveNLPModel(modelData);

  logger.info("✅ New NLP Model trained and saved!");
}

// ❗❗ Chiamata a trainAndSaveNLP() solo se il modello non esiste già
(async () => {
  try {
    const model = await loadNLPModel();
    if (!model) {
      await trainAndSaveNLP();
    }
  } catch (error) {
    logger.error("❌ Error initializing NLP model:", error.message);
  }
})();

module.exports = { loadNLPModel, saveNLPModel, NLPModel, trainAndSaveNLP };