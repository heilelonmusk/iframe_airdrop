const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

// Get connection string from environment variable
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

    // Log the raw event body for debugging
    console.log("Raw event body:", event.body);
    
    // Ensure event.body exists and parse JSON
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Empty request body" })
      };
    }
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" })
      };
    }

    // Extract and trim the question
    const question = data.question ? data.question.trim() : "";
    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing question" })
      };
    }

    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("heilelonDB"); // Change the database name if needed
    const collection = db.collection("questions");

    // Look for a similar question (case-insensitive)
    const existing = await collection.findOne({
      question: { $regex: new RegExp(question, 'i') }
    });

    let responseContent = {};

    if (existing && existing.answer) {
      responseContent = {
        answer: existing.answer,
        source: existing.source
      };
    } else {
      // If no matching answer found, record the new question for future updates
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
