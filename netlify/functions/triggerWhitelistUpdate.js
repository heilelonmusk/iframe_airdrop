// triggerWhitelistUpdate.js
exports.handler = async function(event, context) {
  // Consenti solo richieste POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }
  
  // Parse del body come JSON
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: "Invalid JSON"
    };
  }
  
  // Verifica che venga fornito il wallet
  if (!data.wallet) {
    return {
      statusCode: 400,
      body: "Missing wallet address"
    };
  }
  
  // Recupera il token dalla variabile d'ambiente (configurato in Netlify)
  const token = process.env.MY_GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: "Server misconfiguration: missing token"
    };
  }
  
  // Configurazione del repository e dell'evento dispatch
  const repoOwner = "heilelonmusk";
  const repoName = "iframe_airdrop";
  const eventType = "update_whitelist";
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
        body: `Error dispatching event: ${responseText}`
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event dispatched successfully." })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};