const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB for seeding"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const Question = mongoose.model('Question', new mongoose.Schema({
  question: String,
  answer: String,
  source: String
}));

const seedData = [
  { question: "What is Helon?", answer: "Helon is a decentralized AI ecosystem.", source: "Official Documentation" },
  { question: "What is Ultron?", answer: "Ultron is an AI-powered chatbot.", source: "Ultron Chat" }
];

async function seedDB() {
  try {
    await Question.insertMany(seedData);
    console.log("✅ Knowledge base seeded successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
}

seedDB();