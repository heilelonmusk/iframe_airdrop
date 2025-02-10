exports.handler = async function(event, context) {
// netlify/functions/triggerWhitelistUpdate.js

exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Whitelist update triggered successfully." })
  };
}; 

 // Gestione Preflight (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: "OK"
    };
  }

  // Consenti solo richieste POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: "Method Not Allowed"
    };
  }
  
  // Parsing del body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: "Invalid JSON"
    };
  }
  
  if (!data.wallet || !data.updateType) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: "Missing wallet address or updateType"
    };
  }
  
  // Recupera il token GitHub
  const token = process.env.MY_GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: "Server misconfiguration: missing token"
    };
  }
  
  // Dispatch su GitHub
  const repoOwner = "heilelonmusk";
  const repoName = "iframe_airdrop";
  const eventType = data.updateType;
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;
  
  const payload = {
    event_type: eventType,
    client_payload: { wallet: data.wallet }
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
        },
        body: `Error dispatching event: ${responseText}`
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: JSON.stringify({ message: "Event dispatched successfully." })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://heilelonmusk.github.io"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
