require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const { getIntent } = require('../modules/intent/intentRecognizer');
const { generateResponse } = require('../modules/nlp/transformer');
const { logConversation } = require('../modules/logging/logger');

const app = express();
const router = express.Router();

// ✅ Rate Limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// ✅ CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://helon.space");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not set! Check Netlify Environment Variables.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Define Schema for questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// ✅ API for logging user questions
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    console.log(`Received question: "${question}"`);

    const intentResult = await getIntent(question);
    let answer = "";

    if (intentResult.intent.startsWith("greeting") || intentResult.intent.startsWith("info")) {
      answer = intentResult.answer || (intentResult.answers && intentResult.answers[0]) || "";
    } else {
      answer = await generateResponse(question);
    }

    const conversation = { question, answer, detectedIntent: intentResult.intent, confidence: intentResult.score, timestamp: new Date() };
    await logConversation(conversation);

    res.json({ answer, source: "Ultron AI" });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ API for updating responses
router.post('/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Both question and answer are required" });
    }
    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source: source || "Ultron AI" },
      { new: true, upsert: true }
    );
    console.log(`Updated answer for "${question}": "${answer}"`);
    res.json({ message: "Answer updated!", updated });
  } catch (error) {
    console.error("Error updating answer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);