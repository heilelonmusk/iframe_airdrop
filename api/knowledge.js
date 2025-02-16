require('dotenv').config();
const tendermintRpcUrl = process.env.TENDERMINT_RPC_URL;
const lcdRestUrl = process.env.LCD_REST_URL;
const evmJsonRpcUrl = process.env.EVM_JSON_RPC_URL;
const { logger } = require("../modules/logging/logger");

// api/knowledge.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Modello per le risposte (puoi usare lo stesso modello di domande o crearne uno dedicato)
const knowledgeSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
  keywords: [String],
  source: { type: String, default: "Manual" }
});
const Knowledge = mongoose.models.Knowledge || mongoose.model('Knowledge', knowledgeSchema);

/**
 * Cerca una risposta nel database.
 * Se non trova nulla, prova a caricare dati statici dal file JSON.
 */
async function findAnswer(query) {
  // Prima cerca nel database per una corrispondenza esatta o tramite keywords
  let record = await Knowledge.findOne({ question: query });
  if (!record) {
    // Se non c'è una corrispondenza esatta, puoi implementare qui una logica di matching più complessa.
    // Ad esempio, cercare in un campo "keywords" se presente:
    record = await Knowledge.findOne({ keywords: query.toLowerCase() });
  }
  if (record) return record;

  // Se non trova nulla nel database, prova a caricare il file statico
  try {
    const dataPath = path.join(__dirname, '../data/knowledge.json');
    const rawData = fs.readFileSync(dataPath);
    const staticData = JSON.parse(rawData);
    // Esegui una ricerca "manuale" nel file, ad esempio controllando se la domanda è presente tra le chiavi
    // Puoi personalizzare questa logica in base a come è strutturato il file JSON
    if (staticData.about && query.toLowerCase().includes("about")) {
      return { answer: staticData.about.description, source: "Static Data" };
    }
    if (staticData.token && query.toLowerCase().includes("token")) {
      return { answer: `Token Name: ${staticData.token.name}, Symbol: ${staticData.token.symbol}`, source: "Static Data" };
    }
  } catch (err) {
    console.error("Errore nel caricamento dei dati statici:", err);
  }

  return null;
}

module.exports = { findAnswer, Knowledge };