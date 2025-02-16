require('dotenv').config();
const mongoose = require('mongoose');
const { Knowledge } = require('./knowledge');
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch(err => console.error("MongoDB connection error:", err));

const seedData = [
  {
    question: "what is helon?",
    answer: "Helon is a decentralized AI ecosystem.",
    source: "Official Documentation"
  },
  {
    question: "what is ultron?",
    answer: "Ultron is an AI-powered chatbot.",
    source: "Ultron Chat"
  },
  {
    question: "channels",
    answer: "Official channels: Twitter (https://x.com/heilelon_), Instagram (https://instagram.com/heil.elonmusk), Telegram (https://t.me/heil_elon).",
    source: "Official Documentation"
  }
];

async function seedDB() {
  try {
    await Knowledge.insertMany(seedData);
    console.log("Knowledge base seeded successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

seedDB();