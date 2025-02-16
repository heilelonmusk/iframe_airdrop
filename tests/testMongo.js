require("dotenv").config();
const connectMongoDB = require("./connectMongoDB");

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