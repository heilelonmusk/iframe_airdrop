require('dotenv').config();
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });
const { loadNLPModel, saveNLPModel, NLPModel } = require("../nlp/nlpModel");

// ✅ Funzione per caricare il modello NLP o allenarlo se non esiste
async function initializeNLP() {
  try {
    const savedModel = await loadNLPModel();
    if (savedModel) {
      manager.import(savedModel);
      console.log("🧠 NLP Model Loaded from DB");
    } else {
      console.log("🚀 Training new NLP Model...");
      await trainNLP(); // <== Assicuriamoci che questa funzione esista!
    }
  } catch (error) {
    console.error("❌ Error initializing NLP model:", error);
  }
}

// ✅ Funzione per allenare il modello NLP
async function trainNLP() {
  console.log("🧠 Training NLP Model...");

  manager.addDocument('en', 'hello', 'greeting');
  manager.addDocument('en', 'hi there', 'greeting');
  manager.addDocument('en', 'goodbye', 'farewell');
  manager.addDocument('en', 'bye', 'farewell');
  manager.addDocument('en', 'where can I find official channels?', 'channels');
  manager.addDocument('en', 'how can I contact Helon?', 'channels');
  manager.addDocument('en', 'help', 'help');
  manager.addDocument('en', 'what can you do?', 'help');

  await manager.train();
  console.log("✅ NLP Model Trained Successfully!");

  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  console.log("✅ NLP Model saved in MongoDB");
}

// ✅ **Predefined Intents & Responses**
const predefinedIntents = {
  "greeting": "Hello! How can I assist you today?",
  "farewell": "Goodbye! Have a great day!",
  "channels": "Here are the official channels:\n- Twitter: https://x.com/heilelon_\n- Instagram: https://instagram.com/heil.elonmusk\n- Telegram: https://t.me/heil_elon",
  "help": "I can help you with information about Helon, its ecosystem, and tokens. Just ask!"
};

// ✅ **Intent Recognition Function**
async function getIntent(question) {
  console.log(`🔍 Analyzing intent for: "${question}"`);

  const result = await manager.process('en', question);
  
  if (result.intent && result.score > 0.7) {
    console.log(`✅ Intent Detected: "${result.intent}" (Score: ${result.score})`);
    
    if (predefinedIntents[result.intent]) {
      return { intent: result.intent, answer: predefinedIntents[result.intent], score: result.score };
    }
    
    return { intent: result.intent, answer: null, score: result.score };
  }

  console.warn("⚠ Unrecognized Intent - Fallback Triggered.");
  return { intent: "unknown", answer: "I'm not sure how to answer that yet. Try rephrasing?", score: 0 };
}

// ✅ **Train Model Function**
async function trainModel() {
  await manager.train();
  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  console.log("✅ NLP Model trained and saved in MongoDB!");
}

// ✅ **Esportiamo le funzioni corrette**
module.exports = { getIntent, initializeNLP, trainModel };