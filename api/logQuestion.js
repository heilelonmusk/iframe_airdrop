const mongoose = require('mongoose');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://helon.space",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const Question = mongoose.model('Question', new mongoose.Schema({
    question: String,
    answer: String,
    source: String,
    createdAt: { type: Date, default: Date.now }
  }));

  if (event.httpMethod === 'POST') {
    try {
      const { question } = JSON.parse(event.body);

      let existing = await Question.findOne({ question });

      if (existing) {
        return {
          statusCode: 200,
          body: JSON.stringify({ answer: existing.answer, source: existing.source })
        };
      }

      const newQuestion = new Question({ question, answer: "Processing...", source: "Ultron AI" });
      await newQuestion.save();

      return {
        statusCode: 200,
        body: JSON.stringify({ answer: "I'm thinking... 🤖", source: "Ultron AI" })
      };

    } catch (error) {
      console.error("❌ Error logging question:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};