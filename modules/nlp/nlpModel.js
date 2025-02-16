const mongoose = require('mongoose');
const logger = require("../logging/logger");
logger.error("This is an error message");

//
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ 
async function loadNLPModel() {
  try {
    const savedModel = await SomeModel.findOne({});
    if (savedModel) {
      // Sostituisci console.log con logger.info se possibile
      logger.info("✅ NLP Model loaded from MongoDB");
      return savedModel.modelData;
    }
    logger.warn("⚠️ No NLP Model found in database. Training required.");
    return null;
  } catch (error) {
    logger.error("❌ Error loading NLP model:", error);
    throw error;
  }
}

// ✅
async function saveNLPModel(modelData) {
  try {
    await NLPModel.updateOne({}, { modelData }, { upsert: true });
    console.log("✅ NLP Model saved in MongoDB");
  } catch (error) {
    console.error("❌ Error saving NLP model:", error);
  }
}

module.exports = { loadNLPModel, saveNLPModel };
