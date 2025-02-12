require('dotenv').config(); // Carica variabili d'ambiente

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require("serverless-http"); // ✅ Netlify Serverless Support

const app = express();
const router = express.Router();
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not set! Check Netlify Environment Variables.");
  process.exit(1);
}

// ✅ Connessione a MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ CORS CONFIGURATION - Risolve il problema CORS
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");  // ✅ Permettiamo tutte le origini
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ✅ Schema & Model per MongoDB
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.model('Question', questionSchema);

// ✅ API per loggare le domande
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "❌ Question is required" });

    console.log(`📩 Received question: "${question}"`);

    let existing = await Question.findOne({ question });

    if (existing) {
      console.log(`✅ Answer found: ${existing.answer}`);
      return res.json({ answer: existing.answer, source: existing.source });
    }

    const newQuestion = new Question({ question });
    await newQuestion.save();

    console.log("📌 New question logged in database");
    res.json({ answer: "I'm thinking... 🤖", source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error saving question:", error);
    res.status(500).json({ error: "❌ Server error" });
  }
});

// ✅ API per aggiornare le risposte
router.post('/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "❌ Both question and answer are required" });

    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source: source || "Ultron AI" },
      { new: true, upsert: true }
    );

    console.log(`🔄 Updated answer: "${answer}" for question: "${question}"`);
    res.json({ message: "✅ Answer updated!", updated });
  } catch (error) {
    console.error("❌ Error updating answer:", error);
    res.status(500).json({ error: "❌ Server error" });
  }
});

// ✅ API Base Route
router.get('/', (req, res) => {
  res.json({ message: "🚀 Ultron AI API is running!" });
});

// ✅ Usa router per Netlify Functions
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);