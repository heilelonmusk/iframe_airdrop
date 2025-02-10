// seedKnowledge.js

// Load environment variables from .env file
require('dotenv').config();

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Get MongoDB connection URI from environment variable
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set in your environment.");
  process.exit(1);
}

const KNOWLEDGE_JSON_PATH = path.resolve(__dirname, 'data', 'knowledge.json');

// Function to read the knowledge.json file
function readKnowledgeFile() {
  try {
    const rawData = fs.readFileSync(KNOWLEDGE_JSON_PATH, 'utf-8');
    const data = JSON.parse(rawData);
    return data;
  } catch (error) {
    console.error("Error reading knowledge.json:", error);
    process.exit(1);
  }
}

// Main function to seed the database
async function seedKnowledge() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log("Connected to MongoDB successfully.");

    // Choose the database and collection (adjust names as necessary)
    const db = client.db("heilelonDB");
    const collection = db.collection("knowledge");

    // Read the knowledge data from the file
    const knowledgeData = readKnowledgeFile();

    // Assume knowledgeData is an object with keys such as "about" and "token"
    // We'll upsert a document for each key
    for (const [key, value] of Object.entries(knowledgeData)) {
      const filter = { type: key }; // e.g., { type: "about" }
      const updateDoc = {
        $set: {
          type: key,
          data: value,
          updatedAt: new Date()
        }
      };
      const options = { upsert: true };
      const result = await collection.updateOne(filter, updateDoc, options);
      if (result.upsertedCount > 0) {
        console.log(`Inserted new document for "${key}".`);
      } else {
        console.log(`Updated existing document for "${key}".`);
      }
    }

    console.log("Knowledge base has been seeded successfully.");

  } catch (error) {
    console.error("Error seeding knowledge:", error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

seedKnowledge();
