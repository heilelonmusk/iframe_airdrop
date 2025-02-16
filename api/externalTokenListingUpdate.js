require('dotenv').config();
const tendermintRpcUrl = process.env.TENDERMINT_RPC_URL;
const lcdRestUrl = process.env.LCD_REST_URL;
const evmJsonRpcUrl = process.env.EVM_JSON_RPC_URL;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { logger } = require("../modules/logging/logger");
logger.error("This is an error message");

// Update the API_URL with the correct endpoint
const API_URL = 'https://dymension-mainnet.public.blastapi.io';

async function updateTokenListings() {
  try {
    const response = await axios.get(API_URL);
    const tokens = response.data || [];

    const filePath = path.join(__dirname, '../data/tokens.json');
    fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2));

    console.log('✅ Token listings updated');
  } catch (error) {
    console.error('❌ Error updating tokens:', error);
  }
}

updateTokenListings();