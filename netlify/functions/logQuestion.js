const { MongoClient } = require('mongodb');
require('dotenv').config(); // Carica le variabili d'ambiente dal file .env

// Ottieni la connection string dalla variabile d'ambiente
const uri = process.env.MONGO_URI;
let cachedClient = null;

// Funzione per connettersi a MongoDB con caching per ambienti serverless
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  try {
    // Consenti solo richieste POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Log della richiesta per il debug
    console.log("Received event:", event);
    console.log("Raw event body:", event.body);

    // Parsing del corpo della richiesta
    let data;
    try {
      data = JSON.parse(event.body);
      console.log("Parsed data:", data);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" })
      };
    }

    // Estrai e valida il campo 'question'
    const question = data.question ? data.question.trim() : "";
    if (!question) {
      console.error("Missing question field");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing question" })
      };
    }

    // Connetti a MongoDB
    const client = await connectToDatabase();
    const db = client.db("heilelonDB"); // Modifica il nome del database se necessario
    const collection = db.collection("questions");

    // Cerca una domanda esistente (ricerca case-insensitive)
    const existing = await collection.findOne({
      question: { $regex: new RegExp(question, 'i') }
    });

    let responseContent = {};

    if (existing && existing.answer) {
      // Se esiste una risposta, restituiscila
      responseContent = {
        answer: existing.answer,
        source: existing.source
      };
    } else {
      // Se non viene trovata una risposta, registra la domanda per aggiornamenti futuri
      const newDoc = {
        question: question,
        answer: null,
        source: "user_input",
        timestamp: new Date()
      };
      await collection.insertOne(newDoc);
      responseContent = {
        answer: "I'm still learning! Your question has been recorded for future updates.",
        source: "user_input"
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(responseContent)
    };

  } catch (error) {
    console.error("Error processing question:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
