const fetch = require('node-fetch');

exports.handler = async function(event) {
  try {
    const { question } = JSON.parse(event.body);

    const response = await fetch(process.env.SERVER_URL + "/logQuestion", {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("❌ logQuestion Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};