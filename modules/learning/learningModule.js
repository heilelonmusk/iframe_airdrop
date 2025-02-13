// modules/learning/learningModule.js
const { getIntent, trainModel } = require('../intent/intentRecognizer');
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;

async function retrainFromLogs() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('ultron_ai');
    const collection = database.collection('conversations');
    const logs = await collection.find({}).toArray();
    console.log("Logs collected for retraining:", logs.length);
    // Custom logic: analyze logs and add new training examples if needed
    await trainModel();
    console.log("Retraining completed.");
  } catch (err) {
    console.error("Error during retraining:", err);
  } finally {
    await client.close();
  }
}

module.exports = { retrainFromLogs };