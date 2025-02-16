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

// ✅ Salva il modello NLP nel database
async function saveNLPModel(modelData) {
  try {
    const result = await NLPModel.updateOne({}, { modelData }, { upsert: true });
    logger.info("✅ NLP Model saved in MongoDB");
    return result;
  } catch (error) {
    logger.error("❌ Error saving NLP model:", error.message);
    throw error;
  }
}

module.exports = { loadNLPModel, saveNLPModel, NLPModel };