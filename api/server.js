require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not set! Check Netlify Environment Variables.");
  process.exit(1);
}

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

// Configurazione CORS
const allowedOrigins = ['https://helon.space', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS BLOCKED: Request from ${origin}`);
      callback(new Error("CORS blocked this request"));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Definizione dello schema e del modello in modo condizionale
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, default: "Processing..." },
  source: { type: String, default: "Ultron AI" },
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// Aggiungi handler per le richieste OPTIONS sulla rotta /logQuestion
router.options('/logQuestion', (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://helon.space");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

// API per il logging delle domande
router.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "❌ Question is required" });
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

// (Eventuale handler per /updateAnswer, se necessario, con logica simile)

router.get('/', (req, res) => {
  res.json({ message: "Ultron AI API is running!" });
});

// Usa il router come funzione Netlify
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);