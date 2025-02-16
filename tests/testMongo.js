require("dotenv").config();
const connectMongoDB = require("../connectMongoDB"); // Corretto il percorso

(async () => {
    try {
        await connectMongoDB();
        console.log("✅ Test MongoDB connection successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
})();