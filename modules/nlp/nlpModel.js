const mongoose = require("mongoose");
const path = require("path");
const { logger } = require(path.resolve(__dirname, "../logging/logger"));
const { NlpManager } = require("node-nlp");

// Definizione dello schema per MongoDB
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});

const nlpInstance = await NLPModel.findOne();
if (nlpInstance) {
  const response = await nlpInstance.processText(input);
}

const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// ✅ Definizione del metodo `processText`
NlpManager.prototype.processText = async function (text) {
  try {
    if (!text) throw new Error("Text cannot be empty or null.");
    const response = await this.process("en", text);
    return response.answer || "No response available.";
  } catch (error) {
    logger.error("❌ NLP Processing error:", error.message);
    return "Error processing text.";
  }
};

// ✅ Funzione per caricare il modello NLP dal database
async function loadNLPModel() {
  try {
    const savedModel = await NLPModel.findOne({});
    if (savedModel) {
      const manager = new NlpManager({ languages: ["en"], forceNER: true, autoSave: false });
      manager.import(savedModel.modelData);
      logger.info("✅ NLP Model loaded from MongoDB");
      return manager;
    }
    logger.warn("⚠️ No NLP Model found in database.");
    return null;
  } catch (error) {
    logger.error("❌ Error loading NLP model:", error.message);
    return null;
  }
}

// ✅ Funzione per salvare il modello NLP nel database
async function saveNLPModel(manager) {
  try {
    const modelData = manager.export();
    await NLPModel.updateOne({}, { modelData }, { upsert: true });
    logger.info("✅ NLP Model saved in MongoDB");
  } catch (error) {
    logger.error("❌ Error saving NLP model:", error.message);
  }
}

// ✅ Funzione per allenare e salvare il modello NLP
async function trainAndSaveNLP() {
  const manager = new NlpManager({ languages: ["en"], forceNER: true, autoSave: false });

  // Aggiunta di un esempio base di training
  manager.addDocument("en", "hello", "greeting");
  manager.addDocument("en", "hi", "greeting");
  manager.addDocument("en", "how are you?", "greeting");

  await manager.train();
  await saveNLPModel(manager);

  logger.info("✅ New NLP Model trained and saved!");
  return manager;
}

// ✅ Recupera o allena il modello NLP se non esiste
async function getOrTrainNLPModel() {
  let model = await loadNLPModel();
  if (!model) {
    logger.warn("⚠️ No existing NLP Model found. Training a new one...");
    model = await trainAndSaveNLP();
  }
  return model;
}

// ✅ Inizializzazione: carica il modello al boot se non siamo nei test
(async () => {
  if (process.env.NODE_ENV !== "test") {
    global.nlpModelCache = await getOrTrainNLPModel();
  }
})();

module.exports = { loadNLPModel, saveNLPModel, trainAndSaveNLP, getOrTrainNLPModel, NLPModel };