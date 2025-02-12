// modules/nlp/transformer.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Legge la chiave API dal file .env
  })
);

async function generateResponse(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini", // Usa il modello più recente
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response ? error.response.data : error);
    return "Sorry, I'm having trouble processing your request.";
  }
}

module.exports = { generateResponse };