const mongoose = require("mongoose");
const logger = console; // Usa console.log se non hai un logger

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 secondi

const connectMongoDB = async () => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    if (mongoose.connection.readyState === 1) {
      logger.info("🔄 MongoDB already connected, reusing existing connection.");
      return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
      logger.warn("⚠️ Mongoose connection is stuck in 'connecting' state. Forcing disconnect...");
      try {
        await mongoose.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Aspetta un secondo per il reset
        logger.info("✅ Forced disconnect successful.");
      } catch (err) {
        logger.error("❌ Error during forced disconnect: " + err.message);
      }
    }

    try {
      logger.info(`🔌 Attempting to connect to MongoDB (Attempt ${attempts + 1}/${MAX_RETRIES})...`);

      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Evita blocchi infiniti
      });

      if (mongoose.connection.readyState === 1) {
        logger.info("📚 Connected to MongoDB successfully!");
        mongoose.connection.on("error", (err) => logger.error("❌ MongoDB error:", err));
        mongoose.connection.on("disconnected", () => logger.warn("⚠️ MongoDB disconnected."));
        mongoose.connection.on("reconnected", () => logger.info("🔄 MongoDB reconnected!"));
        return mongoose.connection;
      }
    } catch (err) {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    }

    attempts++;
    logger.warn(`🔁 Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
  }

  logger.error("🚨 Max retries reached. MongoDB connection failed.");
  throw new Error("MongoDB connection failed after multiple attempts.");
};

module.exports = connectMongoDB;