// script/externalTokenListingUpdate.js

require('dotenv').config(); // Load environment variables

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Updated BlastAPI endpoint for Dymension token data.
// Refer to: https://docs.blastapi.io/blast-documentation/apis-documentation/core-api/dymension/
const DYMENSION_API_URL = 'https://blastapi.io/public-api/dymension/tokens';

// Path to the knowledge.json file
const KNOWLEDGE_JSON_PATH = path.resolve(__dirname, '../data/knowledge.json');

async function fetchDymensionData() {
  try {
    const response = await axios.get(DYMENSION_API_URL);
    console.log("Full API response:", JSON.stringify(response.data, null, 2));
    
    // Attempt to extract tokens from expected keys
    let tokens = [];
    if (response.data) {
      if (response.data.data && Array.isArray(response.data.data.tokens)) {
        tokens = response.data.data.tokens;
      } else if (Array.isArray(response.data.tokens)) {
        tokens = response.data.tokens;
      } else {
        console.warn("Tokens not found under expected keys in the API response.");
      }
    }
    // Filter out any null or undefined entries
    tokens = Array.isArray(tokens) ? tokens.filter(token => token != null) : [];
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

    // Find the HELON token (case-insensitive search)
    const helonToken = tokens.find(token => token && token.symbol && token.symbol.toLowerCase() === 'helon');
    console.log("helonToken found:", helonToken);
    
    if (helonToken) {
      const tokenName = helonToken.name;
      if (typeof tokenName === 'undefined') {
        console.warn("Warning: HELON token found but 'name' property is undefined. Full token object:", helonToken);
      }
      knowledge.token = {
        name: tokenName || "Heil Elon",
        symbol: helonToken.symbol || "HELON",
        description: helonToken.description || "Token used in the Helon ecosystem for governance, fees, and incentives.",
        address: helonToken.address || "0xae2d11954812a870aec79f73a948d7f3c31607ae",
        decimals: helonToken.decimals || 18,
        official_source: "https://helon.space",
        rpc_endpoint: helonToken.rpc_endpoint || "https://dymension-mainnet.public.blastapi.io",
        tendermint_endpoint: helonToken.tendermint_endpoint || "https://dymension-mainnet-tendermint.public.blastapi.io",
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
