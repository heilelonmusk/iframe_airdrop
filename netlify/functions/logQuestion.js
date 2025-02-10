const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

// Connection URI from environment variable
const uri = process.env.MONGO_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Parse incoming request
    const { question } = JSON.parse(event.body);
    const trimmedQuestion = question ? question.trim() : "";
    if (!trimmedQuestion) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing question" })
      };
    }

    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("heilelonDB"); // Use your desired database name
    const collection = db.collection("questions");

    // Search for a similar question (case-insensitive)
    const existing = await collection.findOne({
      question: { $regex: new RegExp(trimmedQuestion, 'i') }
    });

    let responseContent = {};

    if (existing && existing.answer) {
      // Return existing answer if found
      responseContent = {
        answer: existing.answer,
        source: existing.source
      };
    } else {
      // Save the new question for future updates
      const newDoc = {
        question: trimmedQuestion,
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
