// modules/nlp/transformer.js
const axios = require('axios');

async function generateResponse(prompt) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error generating response:", error);
    return "Sorry, I'm having trouble processing your request.";
  }
}

module.exports = { generateResponse };