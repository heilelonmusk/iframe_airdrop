require('dotenv').config();
const OpenAI = require("openai");
const mongoose = require("mongoose");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Knowledge Base Schema
const Question = mongoose.models.Question || mongoose.model('Question', new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
}));

async function generateResponse(prompt) {
  try {
    // ✅ Check the database first
    const storedAnswer = await Question.findOne({ question: prompt });
    if (storedAnswer) {
      console.log("Serving response from database.");
      return storedAnswer.answer;
    }

    // ✅ If not found, use GPT-3.5
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50, 
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return "Sorry, I'm having trouble processing your request.";
  }
}

module.exports = { generateResponse };