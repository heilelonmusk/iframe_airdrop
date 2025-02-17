require("dotenv").config();
const connectMongoDB = require("../connectMongoDB"); // Corretto il percorso

// Verifica se è disponibile una variabile d'ambiente valida
if (!process.env.MONGO_URI || !process.env.MONGO_URI.startsWith("mongodb")) {
    console.warn("⚠️ MONGO_URI non trovato o non valido. Saltando test MongoDB.");
    process.exit(0); // Evita errori se non c'è una connessione disponibile
}

(async () => {
    try {
        await connectMongoDB();
        console.log("✅ Test MongoDB connection successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test MongoDB connection failed:", error);
        process.exit(1);
    }
})();