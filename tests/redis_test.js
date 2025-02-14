const redis = require("./api/unifiedAccess"); // Assumendo che Redis sia definito lì

(async () => {
    try {
        const pong = await redis.ping();
        console.log("✅ Redis Ping Response:", pong);
    } catch (err) {
        console.error("❌ Redis Connection Failed:", err);
    } finally {
        redis.disconnect(); // Chiude la connessione dopo il test
    }
})();