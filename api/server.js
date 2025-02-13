require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { getIntent } = require('../modules/intent/intentRecognizer');
const { generateResponse } = require('../modules/nlp/transformer');
const { logConversation } = require('../modules/logging/logger');

const app = express();
const router = express.Router();

// ✅ **CORS Configuration**
const allowedOrigins = ["https://helon.space"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy: Not allowed by CORS"));
  }
}));
app.use(express.json());

// ✅ **Rate Limiting**
app.set('trust proxy', 1); // Required for Netlify rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, 
  message: "Too many requests. Please try again later."
});
app.use(limiter);

// ✅ **MongoDB Connection**
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! API will not function.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("📚 Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ **Schema & Model for Knowledge Base**
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// ✅ **Schema for Storing NLP Model**
const NLPModelSchema = new mongoose.Schema({
  model: { type: Object, required: true }
});
const NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);

// ✅ **Load NLP Model from MongoDB**
const loadNLPModel = async () => {
  try {
    const savedModel = await NLPModel.findOne({});
    if (savedModel && savedModel.model) {
      console.log("✅ NLP Model loaded from MongoDB");
      return savedModel.model;
    }
    console.log("⚠️ No NLP Model found in database. Training required.");
    return null;
  } catch (error) {
    console.error("❌ Error loading NLP model from MongoDB:", error);
    return null;
  }
};

// ✅ **Save NLP Model to MongoDB**
const saveNLPModel = async (modelData) => {
  try {
    await NLPModel.updateOne({}, { model: modelData }, { upsert: true });
    console.log("✅ NLP Model saved in MongoDB");
  } catch (error) {
    console.error("❌ Error saving NLP model:", error);
  }
};

// ✅ **API Endpoint: Handle User Questions**
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    console.log(`📩 Received question: "${question}"`);

    // 🔍 **Step 1: Check the Knowledge Base First**
    let storedAnswer = await Question.findOne({ question });
    if (storedAnswer) {
      console.log(`✅ Found answer in DB: "${storedAnswer.answer}"`);
      return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });
    }

    // 🔍 **Step 2: Process Intent Detection**
    const intentResult = await getIntent(question);
    let finalAnswer = intentResult.answer || intentResult.answers?.[0] || await generateResponse(question);

    // 📌 **Log the interaction**
    await logConversation({
      question,
      answer: finalAnswer,
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date()
    });

    // ✅ **Store Answer for Future Use**
    const newEntry = new Question({ question, answer: finalAnswer, source: "Ultron AI" });
    await newEntry.save();

    res.json({ answer: finalAnswer, source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ **API: Update Answers**
router.post('/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "Both question and answer are required" });

    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source: source || "Ultron AI" },
      { new: true, upsert: true }
    );

    console.log(`🔄 Updated answer for "${question}": "${answer}"`);
    res.json({ message: "Answer updated!", updated });
  } catch (error) {
    console.error("❌ Error updating answer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ **Netlify Functions Integration**
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);