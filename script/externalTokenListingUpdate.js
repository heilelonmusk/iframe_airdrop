// script/externalTokenListingUpdate.js

require('dotenv').config(); // Load environment variables

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Use the BlastAPI endpoint for Dymension token listing.
// Refer to the documentation:
// - Core API: https://docs.blastapi.io/blast-documentation/apis-documentation/core-api/dymension/
// - Tendermint API: https://docs.blastapi.io/blast-documentation/tendermint/
const DYMENSION_API_URL = 'https://blastapi.io/public-api/dymension';

// Path to the knowledge.json file
const KNOWLEDGE_JSON_PATH = path.resolve(__dirname, '../data/knowledge.json');

async function fetchDymensionData() {
  try {
    const response = await axios.get(DYMENSION_API_URL);
    console.log("Fetched data:", response.data);
    // Adjust the extraction below if the structure differs.
    // For example, if tokens are under response.data.data.tokens:
    const tokens = (response.data.data && response.data.data.tokens) || [];
    console.log("Extracted tokens array:", tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching tokens from BlastAPI:', error.message);
    return [];
  }
}

async function updateKnowledgeJson(tokens) {
  try {
    let knowledge = {};
    if (fs.existsSync(KNOWLEDGE_JSON_PATH)) {
      const rawData = fs.readFileSync(KNOWLEDGE_JSON_PATH, 'utf-8');
      knowledge = JSON.parse(rawData);
    } else {
      console.log("knowledge.json not found; creating a new file.");
    }

    // Look for the HELON token (case-insensitive match)
    const helonToken = tokens.find(token => token && token.symbol && token.symbol.toLowerCase() === 'helon');
    console.log("helonToken:", helonToken);
    
    if (helonToken) {
      // Safely extract token properties; warn if 'name' is missing
      const tokenName = helonToken.name;
      if (typeof tokenName === 'undefined') {
        console.warn("Warning: HELON token found but no 'name' property exists. Full token object:", helonToken);
      }
      knowledge.token = {
        name: tokenName || "Heil Elon",
        symbol: helonToken.symbol || "HELON",
        description: helonToken.description || "Token used in the Helon ecosystem for governance, fees, and incentives.",
        address: helonToken.address || "0xae2d11954812a870aec79f73a948d7f3c31607ae",
        decimals: helonToken.decimals || 18,
        official_source: "https://helon.space",
        rpc_endpoint: helonToken.rpc_endpoint || "https://dymension-mainnet.public.blastapi.io",
        wss_endpoint: helonToken.wss_endpoint || "wss://dymension-mainnet.public.blastapi.io"
      };
      fs.writeFileSync(KNOWLEDGE_JSON_PATH, JSON.stringify(knowledge, null, 2));
      console.log('Knowledge JSON updated successfully with token data.');
    } else {
      console.log('No HELON token found in the fetched data.');
    }
  } catch (error) {
    console.error('Error updating knowledge.json:', error);
  }
}

async function main() {
  const tokens = await fetchDymensionData();
  if (tokens.length > 0) {
    await updateKnowledgeJson(tokens);
  } else {
    console.log('No tokens fetched. Knowledge JSON not updated.');
  }
}

main();
