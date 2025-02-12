const mongoose = require('mongoose');
require('dotenv').config();
const { Knowledge } = require('./knowledge');  // if you use the knowledge module from earlier

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch(err => console.error("MongoDB connection error:", err));

const seedData = [
  {
    question: "What is Helon?",
    answer: "Helon is a decentralized AI ecosystem.",
    source: "Official Documentation",
    keywords: ["helon", "ecosystem"]
  },
  {
    question: "What is Ultron?",
    answer: "Ultron is an AI-powered chatbot.",
    source: "Ultron Chat",
    keywords: ["ultron", "chatbot"]
  },
  {
    question: "channels",
    answer: "Here are the official channels: \n- Twitter: [https://x.com/heilelon_](https://x.com/heilelon_) \n- Instagram: [https://instagram.com/heil.elonmusk](https://instagram.com/heil.elonmusk) \n- Telegram: [https://t.me/heil_elon](https://t.me/heil_elon)",
    source: "Official Documentation",
    keywords: ["channels", "official channels", "links", "socials", "community"]
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