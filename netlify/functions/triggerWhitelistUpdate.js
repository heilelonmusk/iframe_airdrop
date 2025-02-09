exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  if (!data.wallet || !data.updateType) {
    return { statusCode: 400, body: "Missing wallet address or update type" };
  }
  
  const token = process.env.MY_GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: "Server misconfiguration: missing token" };
  }
  
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
      return { statusCode: response.status, body: `Error dispatching event: ${responseText}` };
    }
    
    return { statusCode: 200, body: JSON.stringify({ message: "Event dispatched successfully." }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};