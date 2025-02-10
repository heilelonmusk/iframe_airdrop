const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DYMENSION_API_URL = 'https://api.dymension.xyz/tokens';
const KNOWLEDGE_JSON_PATH = path.resolve(__dirname, '../data/knowledge.json');

async function fetchDymensionTokens() {
  try {
    const response = await axios.get(DYMENSION_API_URL);
    console.log("Fetched tokens:", response.data.tokens);
    return response.data.tokens; // Ensure this returns an array of tokens
  } catch (error) {
    console.error('Error fetching tokens from Dymension:', error);
    return [];
  }
}

async function updateKnowledgeJson(tokens) {
  try {
    let knowledge = {};
    if (fs.existsSync(KNOWLEDGE_JSON_PATH)) {
      const rawData = fs.readFileSync(KNOWLEDGE_JSON_PATH, 'utf-8');
      knowledge = JSON.parse(rawData);
    }
    
    // Look for the HELON token
    const helonToken = tokens.find(token => token.symbol && token.symbol.toLowerCase() === 'helon');
    console.log("helonToken:", helonToken);
    if (helonToken) {
      knowledge.token = {
        name: helonToken.name || "Heil Elon",
        symbol: helonToken.symbol || "HELON",
        description: helonToken.description || "Token used in the Helon ecosystem for governance, fees, and incentives.",
        address: helonToken.address || "0xae2d11954812a870aec79f73a948d7f3c31607ae",
        decimals: helonToken.decimals || 18,
        official_source: "https://helon.space"
      };
      fs.writeFileSync(KNOWLEDGE_JSON_PATH, JSON.stringify(knowledge, null, 2));
      console.log('Knowledge JSON updated successfully with token data.');
    } else {
      console.log('No HELON token found in fetched data.');
    }
  } catch (error) {
    console.error('Error updating knowledge.json:', error);
  }
}

async function main() {
  const tokens = await fetchDymensionTokens();
  if (tokens.length > 0) {
    await updateKnowledgeJson(tokens);
  } else {
    console.log('No tokens fetched. Knowledge JSON not updated.');
  }
}

main();
