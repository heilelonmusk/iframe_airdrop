// dymensionAPI.js
require('dotenv').config();
const axios = require('axios');
const { ethers } = require("ethers");
const { logger, logConversation, getFrequentQuestions } = require("../modules/logging/logger");

// Load endpoints from environment variables
const TENDERMINT_RPC_URL = process.env.TENDERMINT_RPC_URL;
const LCD_REST_URL = process.env.LCD_REST_URL;
const EVM_JSON_RPC_URL = process.env.EVM_JSON_RPC_URL;

/** Tendermint RPC Call */
async function getLatestBlock() {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "block",
    params: []
  };
  const response = await axios.post(TENDERMINT_RPC_URL, payload);
  return response.data;
}

/** LCD REST Call: Get account information */
async function getAccountInfo(address) {
  const response = await axios.get(`${LCD_REST_URL}/cosmos/auth/v1beta1/accounts/${address}`);
  return response.data;
}

/** EVM JSON-RPC Call: Get network info */
async function getEvmNetworkInfo() {
  const provider = new ethers.providers.JsonRpcProvider(EVM_JSON_RPC_URL);
  return await provider.getNetwork();
}

module.exports = {
  getLatestBlock,
  getAccountInfo,
  getEvmNetworkInfo
};