const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const TOKEN_API_URL = "https://dymension-api.com/latestTokens";
const TOKEN_FILE_PATH = path.resolve(__dirname, 'data', 'tokens.json');

async function updateTokenListings() {
    try {
        const response = await fetch(TOKEN_API_URL);
        const tokens = await response.json();
        
        fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
        console.log("✅ Token listings updated.");
    } catch (error) {
        console.error("❌ Failed to update token listings:", error);
    }
}

updateTokenListings();