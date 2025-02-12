const { handler } = require('../api/server.js');

async function runTests() {
  // Crea un evento simulato per una richiesta POST all'endpoint logQuestion,
  // utilizzando il percorso completo come montato in server.js
  const event = {
    httpMethod: 'POST',
    path: '/.netlify/functions/server/logQuestion',
    body: JSON.stringify({ question: "What is Helon?" })
  };

  try {
    const response = await handler(event, {});
    // Verifica il corpo della risposta (deve essere un JSON valido)
    const data = JSON.parse(response.body);
    
    if (data.answer) {
      console.log("✅ Test Passed: Answer Received.", data);
    } else {
      console.error("❌ Test Failed: No answer received.", response.body);
    }
  } catch (err) {
    console.error("❌ Test Error:", err);
  }
}

runTests();