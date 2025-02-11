(function () {
  if (window.self !== window.top) return;

  console.log("✅ Ultron Chat is initializing...");

  // Creazione del container principale
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  document.body.appendChild(container);

  container.innerHTML = `
    <button id="ultronChatButton" class="ultron-button">
      <div class="ultron-pulse"></div>
      <img src="ultron_chat/ultronChat.png" alt="Ultron">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">Ultron – Heil Elon</header>
      <div class="ultron-body" id="chatBody">
        <p>Hi, I'm ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe.</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type here..." />
        <button id="ultronSendButton">Send</button>
      </div>
    </div>
  `;

  // **IMPORTANTE**: Aggiunta manuale del CSS se non viene caricato
  if (!document.querySelector('link[href="ultron_chat/ultronChat.css"]')) {
    const styleSheet = document.createElement("link");
    styleSheet.rel = "stylesheet";
    styleSheet.href = "ultron_chat/ultronChat.css";
    document.head.appendChild(styleSheet);
  }

  console.log("✅ Ultron Chat elements added to the page.");

  // Delay di 3 secondi per l'apparizione dell'icona
  setTimeout(() => {
    const chatButton = document.getElementById("ultronChatButton");
    if (chatButton) chatButton.style.opacity = "1";
  }, 3000);

  // Click per aprire/chiudere la chat
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  document.getElementById("ultronSendButton").addEventListener("click", sendChat);

  async function sendChat() {
    const input = document.getElementById("chatInput").value.trim();
    if (!input) return;

    document.getElementById("chatBody").innerHTML += `<p><strong>You:</strong> ${input}</p>`;

    try {
      const response = await fetch("/api/logQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById("chatBody").innerHTML += `<p><strong>Ultron:</strong> ${data.answer || "Processing..."}</p>`;
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
})();