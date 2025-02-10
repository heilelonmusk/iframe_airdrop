const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  // Permette solo il metodo POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }
  
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: "Invalid JSON"
    };
  }
  
  const question = data.question;
  if (!question) {
    return {
      statusCode: 400,
      body: "Missing question"
    };
  }
  
  // Percorso del file knowledge.json (assumendo che la cartella data sia nella root del repository)
  const filePath = path.join(__dirname, '../../data/knowledge.json');
  let knowledge = [];
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      knowledge = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Errore nella lettura di knowledge.json:", error);
    knowledge = [];
  }
  
  // Crea un nuovo record per la domanda con timestamp
  const newEntry = {
    question: question,
    timestamp: new Date().toISOString()
  };
  
  knowledge.push(newEntry);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(knowledge, null, 2));
  } catch (error) {
    console.error("Errore nella scrittura di knowledge.json:", error);
    return {
      statusCode: 500,
      body: "Errore nella scrittura dei dati"
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Domanda registrata", entry: newEntry })
  };
};
