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

// ✅ **Rate Limiting to Prevent Spam & Abuse**
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 🔹 Stricter limit: 10 requests per minute
  message: "Too many requests. Please try again later."
});
app.use(limiter);

// ✅ **MongoDB Connection**
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! API will not function.");
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
    let finalAnswer = "";

    if (intentResult.intent.startsWith("greeting") || intentResult.intent.startsWith("info")) {
      finalAnswer = intentResult.answer || intentResult.answers?.[0] || "";
    } else {
      finalAnswer = await generateResponse(question);
    }

    // 📌 **Log the interaction**
    const conversation = {
      question,
      answer: finalAnswer,
      detectedIntent: intentResult.intent,
      confidence: intentResult.score,
      timestamp: new Date()
    };
    await logConversation(conversation);

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

// ✅ **Health Check Endpoint**
router.get('/', (req, res) => {
  res.json({ message: "✅ Ultron AI API is running!" });
});

// ✅ **New API Endpoint: Repository Structure**
const getRepoStructure = (dirPath, baseDir = "") => {
    let results = [];
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results.push({ type: "folder", name: file, path: path.join(baseDir, file) });
            results = results.concat(getRepoStructure(filePath, path.join(baseDir, file)));
        } else {
            results.push({ type: "file", name: file, path: path.join(baseDir, file) });
        }
    });

    return results;
};

// ✅ **API: Get Repository Structure**
router.get('/repository-structure', (req, res) => {
  try {
    const repoStructure = getRepoStructure(__dirname); // Root directory
    res.json({ status: "success", data: repoStructure });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to retrieve repository structure", error });
  }
});

// ✅ **Netlify Functions Integration**
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);