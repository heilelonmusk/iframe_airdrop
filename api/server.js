require('dotenv').config(); // Carica variabili d'ambiente

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS migliorato: Accetta solo richieste da Helon.Space e localhost
const allowedOrigins = ['https://helon.space', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked this request 🚫"));
    }
  }
}));

app.use(express.json());

// ✅ Connessione a MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ ERROR: MONGO_URI is not set! Check Netlify Environment Variables.");
  process.exit(1);
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Schema e modello per le domande e risposte
const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  source: String,
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.model('Question', questionSchema);

// ✅ API per loggare le domande e fornire risposte
app.post('/api/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "❌ Question is required" });

    console.log(`📩 Received question: "${question}"`);

    // Cerca la domanda nel database
    let existing = await Question.findOne({ question });

    if (existing) {
      console.log(`✅ Answer found: ${existing.answer}`);
      return res.json({ answer: existing.answer, source: existing.source });
    }

    // Salva la domanda nel database
    const newQuestion = new Question({ question, answer: "Processing...", source: "Ultron AI" });
    await newQuestion.save();

    console.log("📌 New question logged in database");
    res.json({ answer: "I'm thinking... 🤖", source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error saving question:", error);
    res.status(500).json({ error: "❌ Server error" });
  }
});

// ✅ API per aggiornare le risposte nel database
app.post('/api/updateAnswer', async (req, res) => {
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

// ✅ Avvia il server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));