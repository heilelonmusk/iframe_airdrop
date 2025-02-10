async function triggerWorkflow(wallet, updateType) {
  const endpoint = "https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/triggerWhitelistUpdate";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: wallet, updateType: updateType })
    });
    const data = await response.json();
    console.log("Dispatch response:", data);
  } catch (error) {
    console.error("Error triggering workflow:", error);
  }
}

async function checkAirdrop() {
  const walletInput = document.getElementById("walletInput");
  const wallet = walletInput.value.trim();
  const resultElem = document.getElementById("result");
  const container = document.getElementById("moduleContainer");

  if (!wallet) {
    resultElem.innerText = "⚠️ Please enter a valid wallet address.";
    container.classList.add("shake");
    walletInput.classList.add("input-error");
    setTimeout(() => {
      container.classList.remove("shake");
      walletInput.classList.remove("input-error");
    }, 700);
    return;
  }

  try {
    const response = await fetch("https://cdn.jsdelivr.net/gh/heilelonmusk/iframe_airdrop@main/data/whitelist.csv");
    if (!response.ok) throw new Error("Network response was not ok");
    const csvText = await response.text();
    const rows = csvText.split("\n").filter(line => line.trim() !==
