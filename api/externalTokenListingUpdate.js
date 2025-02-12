const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.dymension.xyz/tokens';

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