require('dotenv').config();
const mongoose = require('mongoose');

const LOG_RETENTION_DAYS = 30; // Auto-delete logs older than this
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! Logging is disabled.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("📜 Connected to MongoDB for logging"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ **Schema Definition for Conversation Logging**
const logSchema = new mongoose.Schema({
  userId: { type: String, default: "anonymous" },
  question: { type: String, required: true },
  answer: { type: String, required: true }, // 🔹 Ora sempre salvato come stringa JSON
  detectedIntent: { type: String },
  confidence: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

// ✅ **Crea il modello**
const ConversationLog = mongoose.models.ConversationLog || mongoose.model('ConversationLog', logSchema);

// ✅ **Log a Conversation**
async function logConversation({ userId, question, answer, detectedIntent, confidence }) {
  try {
    const logEntry = new ConversationLog({
      userId,
      question,
      answer: typeof answer === "string" ? answer : JSON.stringify(answer), // 🔹 Converte oggetti in stringhe JSON
      detectedIntent,
      confidence
    });

    await logEntry.save();
    console.log("📝 Conversation logged successfully.");
  } catch (error) {
    console.error("❌ Error logging conversation:", error);
  }
}

// ✅ **Retrieve Most Frequent Questions (for improvements)**
async function getFrequentQuestions(limit = 5) {
  try {
    const results = await ConversationLog.aggregate([
      { $group: { _id: "$question", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    return results.map(q => ({ question: q._id, count: q.count }));
  } catch (error) {
    console.error("❌ Error retrieving frequent questions:", error);
    return [];
  }
}

// ✅ **Auto-Delete Old Logs (Retention Policy)**
async function cleanupOldLogs() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);
    const result = await ConversationLog.deleteMany({ timestamp: { $lt: cutoff } });

    console.log(`🗑 Deleted ${result.deletedCount} old log entries.`);
  } catch (error) {
    console.error("❌ Error deleting old logs:", error);
  }
}

// Schedule log cleanup every 24 hours
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

module.exports = { logConversation, getFrequentQuestions };