const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

const uri = process.env.MONGO_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  // MongoDB Driver 4.x uses the new parser and unified topology by default.
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  try {
    // Accept only POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    console.log("Received event:", event);
    console.log("Raw event body:", event.body);

    // Parse the JSON request body
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

    const question = data.question ? data.question.trim() : "";
    if (!question) {
      console.error("Missing question field");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing question" })
      };
    }

    // Connect to MongoDB and select the appropriate database and collection
    const client = await connectToDatabase();
    const db = client.db("heilelonDB");
    const collection = db.collection("questions");

    // Check for an existing similar question (case-insensitive)
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
      // Insert the new question for later review/processing
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
