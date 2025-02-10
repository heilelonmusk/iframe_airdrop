exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { question } = JSON.parse(event.body);
  if (!question) return { statusCode: 400, body: "Missing question" };

  const token = process.env.MY_GITHUB_TOKEN;
  const url = "https://api.github.com/repos/heilelonmusk/iframe_airdrop/dispatches";

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ event_type: "log_question", client_payload: { question } })
  });

  return { statusCode: 200, body: JSON.stringify({ message: "Question logged." }) };
};
