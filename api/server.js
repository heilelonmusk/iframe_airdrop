require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const timeout = require('connect-timeout');
const { NlpManager } = require('node-nlp');

// Import moduli necessari
const { initializeNLP, getIntent } = require('../modules/intent/intentRecognizer');
const { loadNLPModel, saveNLPModel } = require('../modules/nlp/nlpModel');
const { generateResponse } = require('../modules/nlp/transformer');
const { logConversation } = require('../modules/logging/logger');

const app = express();
const router = express.Router();
const manager = new NlpManager({ languages: ['en'], autoSave: false, autoLoad: false });

// ✅ **CORS Configuration**
app.use(cors({
  origin: "https://helon.space",
  credentials: true
}));
app.use(express.json());
app.use(timeout('10s')); // Timeout per evitare richieste lente

// ✅ **Rate Limiting**
app.set('trust proxy', 1);
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again later.",
  keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(',')[0] || req.ip || "unknown-ip",
}));

// ✅ **MongoDB Connection**
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! API will not function.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📚 Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

// ✅ **Schema & Model for Knowledge Base**
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true }, // Ora sempre salvato come stringa JSON
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// ✅ **Schema for Storing NLP Model in MongoDB**
const NLPModelSchema = new mongoose.Schema({
  modelData: { type: Object, required: true }
});
const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ **Initialize NLP Model**
(async () => {
  try {
    const savedModel = await loadNLPModel();
    if (savedModel && Object.keys(savedModel).length > 0) {
      manager.import(savedModel);
      console.log("🧠 NLP Model Loaded from DB");
    } else {
      console.log("🚀 Training new NLP Model...");
      await trainAndSaveNLP();
    }
  } catch (error) {
    console.error("❌ Error initializing NLP model:", error);
  }
})();

// ✅ **Train NLP Model & Save to MongoDB**
async function trainAndSaveNLP() {
  manager.addDocument('en', 'hello', 'greeting');
  manager.addDocument('en', 'hi there', 'greeting');
  manager.addDocument('en', 'goodbye', 'farewell');
  manager.addDocument('en', 'bye', 'farewell');
  manager.addDocument('en', 'where can I find official channels?', 'channels');
  manager.addDocument('en', 'how can I contact Helon?', 'channels');
  manager.addDocument('en', 'help', 'help');
  manager.addDocument('en', 'what can you do?', 'help');

  await manager.train();
  const exportedModel = manager.export();
  await saveNLPModel(exportedModel);
  console.log("✅ New NLP Model trained and saved!");
}

// ✅ **API Endpoint: Handle User Questions**
router.post('/logQuestion', async (req, res) => {
  try {
    const { question, userId } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    console.log(`📩 Received question: "${question}"`);

    // Usa un valore predefinito per userId se non è fornito
    const anonymousUser = userId || "anonymous";

    // 🔍 **Step 1: Check the Knowledge Base First**
    let storedAnswer = await Question.findOne({ question });

    if (storedAnswer) {
      console.log(`✅ Found answer in DB: ${JSON.stringify(storedAnswer.answer)}`);

      // Se storedAnswer.answer è `null` o `undefined`, impostiamo un valore di default
      let safeAnswer = storedAnswer.answer;
      if (!safeAnswer) {
        safeAnswer = "No answer found.";
      } else if (typeof safeAnswer === "object") {
        safeAnswer = safeAnswer.answer || "No answer found.";
      }

      return res.json({
        answer: safeAnswer,
        source: storedAnswer.source || "Unknown"
      });
    }

    // 🔍 **Step 2: Process Intent Detection**
    const intentResult = await manager.process('en', question);
    let finalAnswer = intentResult.answer || await generateResponse(question) || "I'm not sure how to answer that yet.";

    // 📌 **Log the interaction**
    await logConversation({
      userId: anonymousUser,
      question,
      answer: typeof finalAnswer === "string" ? finalAnswer : JSON.stringify(finalAnswer),
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date()
    });

    // ✅ **Store Answer for Future Use**
    const newEntry = new Question({
      question,
      answer: typeof finalAnswer === 'string' ? finalAnswer : { answer: finalAnswer, source: "Ultron AI" },
      source: "Ultron AI"
    });
    await newEntry.save();

    res.json({ answer: finalAnswer, source: "Ultron AI" });

  } catch (error) {
    console.error("❌ Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.use("/.netlify/functions/server", router);

const fs = require('fs');
fs.writeFileSync = () => { throw new Error("File system write disabled!"); };
fs.appendFileSync = () => { throw new Error("File system write disabled!"); };
fs.createWriteStream = () => { throw new Error("File system write disabled!"); };

module.exports = { app, handler: serverless(app) };