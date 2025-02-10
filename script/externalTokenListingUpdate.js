// scripts/externalTokenListingUpdate.js

// Load environment variables (if needed)
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Use the BlastAPI endpoint for Dymension
const DYMENSION_API_URL = 'https://blastapi.io/public-api/dymension';

// Path to the knowledge.json file (adjust if necessary)
const KNOWLEDGE_JSON_PATH = path.resolve(__dirname, '../data/knowledge.json');

// Function to fetch token data from BlastAPI for Dymension
async function fetchDymensionData() {
  try {
    const response = await axios.get(DYMENSION_API_URL);
    // Log the full data for debugging purposes
    console.log("Fetched data:", response.data);
    // Assume the API returns an object with a tokens array or similar structure.
    // You may need to adjust this based on the actual API response.
    // For example, if the response is { tokens: [ ... ] }:
    return response.data.tokens || [];
  } catch (error) {
    console.error('Error fetching data from BlastAPI:', error.message);
    return [];
  }
}

// Function to update knowledge.json with token data
async function updateKnowledgeJson(tokens) {
  try {
    let knowledge = {};
    if (fs.existsSync(KNOWLEDGE_JSON_PATH)) {
      const rawData = fs.readFileSync(KNOWLEDGE_JSON_PATH, 'utf-8');
      knowledge = JSON.parse(rawData);
    }

    // Look for the HELON token in the fetched tokens data
    // Adjust this logic based on the actual API response structure.
    const helonToken = tokens.find(token => 
      token.symbol && token.symbol.toLowerCase() === 'helon'
    );
    console.log("helonToken:", helonToken);
    
    if (helonToken) {
      knowledge.token = {
        name: helonToken.name || "Heil Elon",
        symbol: helonToken.symbol || "HELON",
        description: helonToken.description || "Token used in the Helon ecosystem for governance, fees, and incentives.",
        address: helonToken.address || "0xYourTokenContractAddressHere",
        decimals: helonToken.decimals || 18,
        official_source: "https://helon.space"
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

// Main function to perform the update
async function main() {
  const tokens = await fetchDymensionData();
  if (tokens.length > 0) {
    await updateKnowledgeJson(tokens);
  } else {
    console.log('No tokens fetched. Knowledge JSON not updated.');
  }
}

main();
