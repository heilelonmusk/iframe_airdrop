require('dotenv').config();
const OpenAI = require("openai");
const mongoose = require("mongoose");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");

// ✅ Load OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! Knowledge Base will not function.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("📚 Connected to MongoDB for Knowledge Base"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ **Knowledge Base Schema**
const knowledgeSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
  source: { type: String, default: "Knowledge Base" },
  createdAt: { type: Date, default: Date.now }
});

const Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", knowledgeSchema);

// ✅ **Check Knowledge Base Before Calling GPT**
async function getAnswerFromKnowledgeBase(question) {
  try {
    const result = await Knowledge.findOne({ question: new RegExp(`^${question}$`, 'i') });
    if (result) {
      console.log(`📖 Answer found in Knowledge Base for: "${question}"`);
      return { answer: result.answer, source: result.source };
    }
    return null;
  } catch (error) {
    console.error("❌ Error querying Knowledge Base:", error);
    return null;
  }
}

// ✅ **Generate AI Response Using GPT (if needed)**
async function generateResponse(question) {
  try {
    // 🔹 Step 1: First check the Knowledge Base
    const knowledgeResponse = await getAnswerFromKnowledgeBase(question);
    if (knowledgeResponse) return knowledgeResponse;

    // 🔹 Step 2: If not found, ask GPT-3.5
    console.log(`🤖 Querying GPT-3.5 for: "${question}"`);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Using cost-effective model
      messages: [{ role: "user", content: question }],
      max_tokens: 100,  // Limits response length to reduce token usage
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("Empty response from GPT");

    // 🔹 Step 3: Store AI-generated response in Knowledge Base
    const newEntry = new Knowledge({ question, answer, source: "GPT-3.5" });
    await newEntry.save();
    console.log("✅ Saved GPT response to Knowledge Base.");

    return { answer, source: "GPT-3.5" };
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return { answer: "Sorry, I'm having trouble processing your request.", source: "Ultron AI" };
  }
}

module.exports = { generateResponse };