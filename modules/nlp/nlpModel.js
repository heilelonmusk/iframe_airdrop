const mongoose = require('mongoose');

//
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ 
async function loadNLPModel() {
  try {
    const savedModel = await NLPModel.findOne({});
    if (savedModel && savedModel.modelData) {
      console.log("✅ NLP Model loaded from MongoDB");
      return savedModel.modelData;
    }
    console.log("⚠️ No NLP Model found in database. Training required.");
    return null;
  } catch (error) {
    console.error("❌ Error loading NLP model from MongoDB:", error);
    return null;
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
