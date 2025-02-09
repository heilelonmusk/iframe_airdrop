async function checkAirdrop() {
  const walletInput = document.getElementById("walletInput");
  const wallet = walletInput.value.trim();
  const resultElem = document.getElementById("result");
  const container = document.querySelector(".checker-container");

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
    const rows = csvText.split("\n").filter(line => line.trim() !== "");
    const header = rows[0].split(",").map(h => h.trim().toLowerCase());
    const walletIndex = header.indexOf("wallet address");
    let isWhitelisted = false;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(col => col.trim());
      if (cols[walletIndex] && cols[walletIndex].toLowerCase() === wallet.toLowerCase()) {
        isWhitelisted = true;
        break;
      }
    }

    if (isWhitelisted) {
      resultElem.innerHTML = "✅ You are eligible!<br>Final airdrop details will be announced by 23:59 CET on Feb. 28.";
      triggerWorkflow(wallet, "update_whitelist");
      // Effetto confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    } else {
      resultElem.innerText = "❌ Not whitelisted, but stay tuned for future opportunities! Join our community channels for updates.";
      container.classList.add("shake");
      setTimeout(() => {
        container.classList.remove("shake");
      }, 700);
      triggerWorkflow(wallet, "update_noneligible");
    }
  } catch (error) {
    resultElem.innerText = "⚠️ Error checking whitelist. Please try again later.";
    console.error(error);
  }
}

async function triggerWorkflow(wallet, updateType) {
  try {
    await fetch("https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/triggerWhitelistUpdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, updateType })
    });
  } catch (error) {
    console.error("Error triggering workflow:", error);
  }
}