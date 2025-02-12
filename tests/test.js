const { handler } = require('../api/server.js');

async function runTests() {
  // Crea un evento simulato per una richiesta POST all'endpoint /logQuestion
  const event = {
    httpMethod: 'POST',
    path: '/logQuestion',
    body: JSON.stringify({ question: "What is Helon?" })
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