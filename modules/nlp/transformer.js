// modules/nlp/transformer.js
require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assicura che la chiave API sia caricata da .env
});

async function generateResponse(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Usa il modello più recente
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return "Sorry, I'm having trouble processing your request.";
  }
}

module.exports = { generateResponse };