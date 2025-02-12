const mongoose = require('mongoose');

exports.handler = async function(event, context) {
  // Gestione della preflight request per CORS
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

  try {
    // Se non è già connesso, stabilisci la connessione a MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Definisci il modello in modo condizionale per evitare OverwriteModelError
    const questionSchema = new mongoose.Schema({
      question: String,
      answer: String,
      source: String,
      createdAt: { type: Date, default: Date.now }
    });
    const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

    if (event.httpMethod === 'POST') {
      const { question } = JSON.parse(event.body);
      // Cerca se la domanda esiste già
      let existing = await Question.findOne({ question });
      if (existing) {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "https://helon.space"
          },
          body: JSON.stringify({ answer: existing.answer, source: existing.source })
        };
      }
      // Crea una nuova domanda
      const newQuestion = new Question({ question, answer: "Processing...", source: "Ultron AI" });
      await newQuestion.save();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://helon.space"
        },
        body: JSON.stringify({ answer: "I'm thinking... ", source: "Ultron AI" })
      };
    }
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (error) {
    console.error("❌ Error logging question:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://helon.space"
      },
      body: JSON.stringify({ error: "Server error" })
    };
  }
};