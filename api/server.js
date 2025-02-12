require('dotenv').config(); // Carica le variabili d'ambiente

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(express.json());
app.use(cors({ origin: '*' })); // Permette richieste da qualsiasi dominio

// ✅ Connessione sicura a MongoDB
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

// ✅ Definizione Schema e Modello
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
    if (!question) return res.status(400).json({ error: "Question is required" });

    // Controlla se la domanda esiste già
    let existing = await Question.findOne({ question });

    if (existing) {
      return res.json({ answer: existing.answer, source: existing.source });
    }

    // Salva la domanda se nuova
    const newQuestion = new Question({ question, answer: "Processing...", source: "Ultron AI" });
    await newQuestion.save();

    res.json({ answer: "I'm thinking... 🤖", source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error saving question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ API per aggiornare le risposte nel database
app.post('/api/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "Both question and answer are required" });

    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source: source || "Ultron AI" },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Answer updated!", updated });
  } catch (error) {
    console.error("❌ Error updating answer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Avvia il server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));