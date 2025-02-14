require("dotenv").config();
const { handler } = require("../api/server.js");

async function runTests() {
  console.log("🛠 Running API Test for logQuestion...");

  // Simulated POST request event for logQuestion endpoint
  const event = {
    httpMethod: "POST",
    path: "/.netlify/functions/server/logQuestion",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: "What is Helon?" }),
    isBase64Encoded: false,
  };

  try {
    console.log("🔹 Checking server availability...");
    const healthEvent = {
      httpMethod: "GET",
      path: "/.netlify/functions/server/health",
    };
    const healthResponse = await handler(healthEvent, {});

    if (!healthResponse || healthResponse.statusCode !== 200) {
      console.error("❌ Server is not available. Health check failed.");
      return;
    }
    
    console.log("✅ Server is available. Proceeding with test...");

    const response = await handler(event, {});

    if (!response || typeof response.statusCode !== "number") {
      console.error("❌ Invalid response received from handler.", response);
      return;
    }

    console.log(`🔹 HTTP Status: ${response.statusCode}`);

    // Ensure response body exists and is valid JSON
    let data;
    try {
      data = JSON.parse(response.body);
    } catch (err) {
      console.error("❌ Failed to parse response body as JSON:", response.body);
      return;
    }

    // Validate response structure
    if (response.statusCode === 200 && data && typeof data.answer === "string") {
      console.log("✅ Test Passed: Answer Received.", data);
    } else {
      console.error("❌ Test Failed: Unexpected response format or missing answer.", data);
    }
  } catch (err) {
    console.error("❌ Test Error:", err);
  }
}

runTests();