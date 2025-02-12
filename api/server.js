const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Schema per le domande e risposte
const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  source: String,
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

// 🔹 API per loggare le domande e fornire risposte
app.post('/logQuestion', async (req, res) => {
  try {
    const { question } = req.body;

    // Verifica se la domanda è già presente
    let existing = await Question.findOne({ question });

    if (existing) {
      return res.json({ answer: existing.answer, source: existing.source });
    }

    // Se non esiste, salva la nuova domanda senza risposta
    const newQuestion = new Question({ question, answer: "Processing...", source: "Ultron AI" });
    await newQuestion.save();

    res.json({ answer: "I'm thinking... 🤖", source: "Ultron AI" });
  } catch (error) {
    console.error("❌ Error saving question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 API per aggiornare le risposte nel database
app.post('/updateAnswer', async (req, res) => {
  try {
    const { question, answer, source } = req.body;

    let updated = await Question.findOneAndUpdate(
      { question },
      { answer, source },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Answer updated!", updated });
  } catch (error) {
    console.error("❌ Error updating answer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));