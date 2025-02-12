// modules/nlp/transformer.js
require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assicura che la chiave API sia caricata da .env
});

async function generateResponse(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // 🔹 Usa il modello più economico
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50, // 🔹 Riduce il consumo di token per risposta
      temperature: 0.7,
   });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return "Sorry, I'm having trouble processing your request.";
  }
}

module.exports = { generateResponse };