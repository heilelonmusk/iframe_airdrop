require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing!");
  process.exit(1);
}

// Connetti a MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("📚 Connected to MongoDB");

    const questionSchema = new mongoose.Schema({
      question: String,
      answer: mongoose.Schema.Types.Mixed,
      source: String,
      createdAt: Date
    });

    const Question = mongoose.model('Question', questionSchema);

    // Trova le prime 5 risposte salvate
    const questions = await Question.find().limit(5);
    console.log("🔍 First 5 Questions:");
    console.log(questions);

    mongoose.connection.close();
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));