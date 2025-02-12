// modules/logging/logger.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

async function logConversation(conversation) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db('ultron_ai');
    const collection = database.collection('conversations');
    await collection.insertOne(conversation);
  } catch (err) {
    console.error("Error logging conversation:", err);
  } finally {
    await client.close();
  }
}

module.exports = { logConversation };