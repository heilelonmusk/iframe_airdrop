exports.handler = async function(event, context) {
  console.log("Received event:", event);
  
  if (event.httpMethod !== "POST") {
    console.log("Method Not Allowed:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  let data;
  try {
    data = JSON.parse(event.body);
    console.log("Parsed data:", data);
  } catch (error) {
    console.error("JSON parse error:", error);
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  if (!data.wallet || !data.updateType) {
    console.error("Missing wallet or updateType in payload.");
    return { statusCode: 400, body: "Missing wallet address or update type" };
  }
  
  const token = process.env.MY_GITHUB_TOKEN;
  if (!token) {
    console.error("Missing MY_GITHUB_TOKEN in environment.");
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
  
  console.log("Dispatching event with payload:", payload);
  
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
      console.error("Dispatch error:", response.status, responseText);
      return { statusCode: response.status, body: `Error dispatching event: ${responseText}` };
    }
    
    console.log("Event dispatched successfully.");
    return { statusCode: 200, body: JSON.stringify({ message: "Event dispatched successfully." }) };
  } catch (error) {
    console.error("Error triggering dispatch:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
