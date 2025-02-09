async function checkAirdrop() {
  const wallet = document.getElementById("walletInput").value.trim();
  if (!wallet) return alert("⚠️ Enter a valid wallet address.");

  try {
    const response = await fetch("https://cdn.jsdelivr.net/gh/heilelonmusk/iframe_airdrop@main/data/whitelist.csv");
    const csvText = await response.text();
    const isWhitelisted = csvText.includes(wallet);

    if (isWhitelisted) {
      document.getElementById("result").innerHTML = "✅ You are eligible!";
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      triggerWorkflow(wallet, "update_whitelist");
    } else {
      document.getElementById("result").innerText = "❌ Not whitelisted.";
      triggerWorkflow(wallet, "update_noneligible");
    }
  } catch (error) {
    document.getElementById("result").innerText = "⚠️ Error checking whitelist.";
    console.error(error);
  }
}

async function triggerWorkflow(wallet, updateType) {
  await fetch("https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/triggerWhitelistUpdate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, updateType })
  });
}
