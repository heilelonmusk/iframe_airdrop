require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require("serverless-http");
const { getIntent } = require('../modules/intent/intentRecognizer');
const { generateResponse } = require('../modules/nlp/transformer');
const { logConversation } = require('../modules/logging/logger');
const tendermintRpcUrl = process.env.TENDERMINT_RPC_URL;
const lcdRestUrl = process.env.LCD_REST_URL;
const evmJsonRpcUrl = process.env.EVM_JSON_RPC_URL;

const app = express();
const router = express.Router();

// Global CORS middleware: sets headers for every request, including preflight OPTIONS.
app.use((req, res, next) => {
  // For testing purposes, you may use "*" or restrict to your specific domain (e.g., "https://helon.space")
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

// Define the schema and model for questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// API endpoint for logging questions
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    console.log(`Received question: "${question}"`);

    // Special handling for "channels"
    if (question.trim().toLowerCase() === "channels") {
      return res.json({
        answer: "Here are the official channels: \n- Twitter: https://x.com/heilelon_ \n- Instagram: https://instagram.com/heil.elonmusk \n- Telegram: https://t.me/heil_elon",
        source: "Official Documentation"
      });
    }

    // Process the intent
    const intentResult = await getIntent(question);
    let answer = "";
    // If the recognized intent is among predefined ones, use its answer
    if (intentResult.intent.startsWith("greeting") || intentResult.intent.startsWith("info")) {
      answer = intentResult.answer || (intentResult.answers && intentResult.answers[0]) || "";
    } else {
      // Otherwise, use dynamic response generation
      answer = await generateResponse(question);
    }

    // Log the conversation with additional details
    const conversation = {
      question,
      answer,
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date()
    };
    await logConversation(conversation);

    res.json({ answer, source: "Ultron AI" });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// (Optional) API endpoint for updating the answer
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

// (Optional) Base route
router.get('/', (req, res) => {
  res.json({ message: "Ultron AI API is running!" });
});

// Mount the router as a Netlify function
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);