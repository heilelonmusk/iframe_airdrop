const { handler } = require('../api/server.js');

async function runTests() {
  // Crea un evento simulato per una richiesta POST all'endpoint logQuestion.
  // È importante includere le intestazioni e specificare che il body non è codificato in base64.
  const event = {
    httpMethod: 'POST',
    path: '/.netlify/functions/server/logQuestion',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question: "What is Helon?" }),
    isBase64Encoded: false
  };

  try {
    const response = await handler(event, {});
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