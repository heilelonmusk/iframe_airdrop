(function () {
  if (window.self !== window.top) return;

  // ✅ Dynamically load the CSS for styling
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.css";
  document.head.appendChild(style);

  // ✅ Create the chat container
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  document.body.appendChild(container);

  // ✅ Define the HTML structure of the chat widget
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button">
      <div class="ultron-pulse"></div>
      <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" alt="Ultron" class="ultron-button-img">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">Ultron – AI Assistant</header>
      <div class="ultron-body" id="chatBody">
        <p>Hi, I'm ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p>💡 Ask me anything about Helon, its vision, the ecosystem, or token details.<br>
           🔗 For official links, type "channels".</p>
        <p>The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here...">
        <button id="ultronSendButton">Send</button>
      </div>
    </div>
  `;

  // ✅ Make the chat button visible after 3 seconds
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // ✅ Toggle widget visibility on button click
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  // ✅ Attach event listener to the send button
  document.getElementById("ultronSendButton").addEventListener("click", sendChat);

  async function sendChat() {
    const input = document.getElementById("chatInput").value.trim();
    const chatBody = document.getElementById("chatBody");
    if (!input) return;

    // ✅ Display user's question
    chatBody.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    document.getElementById("chatInput").value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // ✅ Create payload and log it for debugging
    const payload = { question: input };
    console.log("Payload sent:", JSON.stringify(payload));

    try {
      const response = await fetch('https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/server/logQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        chatBody.innerHTML += `<p><strong>Ultron:</strong> ${data.answer} <small>(Source: ${data.source})</small></p>`;
      } else {
        console.error("Error logging question:", response.status);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  }
})();