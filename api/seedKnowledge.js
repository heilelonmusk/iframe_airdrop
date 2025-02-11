require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is missing.");
  process.exit(1);
}

async function seedKnowledge() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("heilelonDB");
        const collection = db.collection("knowledge");
        
        const knowledgeData = JSON.parse(fs.readFileSync('knowledge.json', 'utf8'));
        for (const [key, value] of Object.entries(knowledgeData)) {
            await collection.updateOne({ type: key }, { $set: { type: key, data: value } }, { upsert: true });
        }
        console.log("✅ Knowledge seeded successfully.");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await client.close();
    }
}

seedKnowledge();