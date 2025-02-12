require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not set! Check Netlify Environment Variables.");
  process.exit(1);
}

// Middleware globale per CORS: imposta gli header per ogni richiesta (incluse le preflight OPTIONS)
app.use((req, res, next) => {
  // Per test, se preferisci puoi usare "*" oppure specificare "https://helon.space"
  res.setHeader("Access-Control-Allow-Origin", "https://helon.space");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Connessione a MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Definizione dello schema e del modello in modo condizionale (evita OverwriteModelError)
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// Middleware aggiuntivo per il router (doppio controllo CORS)
router.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "https://helon.space");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// API per il logging delle domande
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "❌ Question is required" });
    }
    console.log(`Received question: "${question}"`);
    let existing = await Question.findOne({ question });
    if (existing) {
      console.log(`✅ Answer found: ${existing.answer}`);
      return res.json({ answer: existing.answer, source: existing.source });
    }
    const newQuestion = new Question({ question });
    await newQuestion.save();
    console.log("New question logged in database");
    res.json({ answer: "I'm thinking... ", source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error saving question:", error);
    res.status(500).json({ error: "❌ Server error" });
  }
});

// (Opzionale) API per aggiornare la risposta
router.post('/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "❌ Both question and answer are required" });
    }
    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source: source || "Ultron AI" },
      { new: true, upsert: true }
    );
    console.log(`Updated answer: "${answer}" for question: "${question}"`);
    res.json({ message: "✅ Answer updated!", updated });
  } catch (error) {
    console.error("❌ Error updating answer:", error);
    res.status(500).json({ error: "❌ Server error" });
  }
});

// API Base Route (opzionale)
router.get('/', (req, res) => {
  res.json({ message: "Ultron AI API is running!" });
});

// Usa il router come funzione Netlify: tutte le rotte saranno accessibili tramite "/.netlify/functions/server/*"
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);