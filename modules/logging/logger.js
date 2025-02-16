require('dotenv').config();
const mongoose = require('mongoose');

const LOG_RETENTION_DAYS = 30; // Auto-delete logs older than this
const MONGO_URI = process.env.MONGO_URI;

const winston = require('winston');

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    // Aggiungi altri transport se necessario (es. File)
  ]
});

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing! Logging is disabled.");
  process.exit(1);
}

// Connessione a MongoDB per il logging
mongoose.connect(MONGO_URI, { })
  .then(() => console.log("📜 Connected to MongoDB for logging"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Schema per il logging delle conversazioni
const logSchema = new mongoose.Schema({
  userId: { type: String, default: "anonymous" },
  question: { type: String, required: true },
  answer: { type: String, required: true }, // Salvato sempre come stringa (JSON)
  detectedIntent: { type: String },
  confidence: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

// Creazione del modello ConversationLog
const ConversationLog = mongoose.models.ConversationLog || mongoose.model('ConversationLog', logSchema);

// Funzione per loggare una conversazione
async function logConversation({ userId, question, answer, detectedIntent, confidence }) {
  try {
    const logEntry = new ConversationLog({
      userId,
      question,
      answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      detectedIntent,
      confidence
    });

    await logEntry.save();
    console.log("📝 Conversation logged successfully.");
  } catch (error) {
    console.error("❌ Error logging conversation:", error);
  }
}

// Funzione per recuperare le domande più frequenti
async function getFrequentQuestions(limit = 5) {
  try {
    const results = await ConversationLog.aggregate([
      { $group: { _id: "$question", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    if (!Array.isArray(results)) {
      console.error("❌ Expected aggregation results to be an array, got:", results);
      return [];
    }
    
    return results.map(q => ({ question: q._id, count: q.count }));
  } catch (error) {
    console.error("❌ Error retrieving frequent questions:", error);
    return [];
  }
}

// Funzione per eliminare automaticamente i log vecchi (Retention Policy)
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

// Pianifica la pulizia dei log ogni 24 ore
const intervalId = setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
intervalId.unref();

module.exports = { 
  logger, 
  logConversation, 
  getFrequentQuestions 
};