(function () {
  if (window.self !== window.top) return;

  // ✅ **Dynamically Load CSS for Ultron Chat**
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.css";
  document.head.appendChild(style);

  // ✅ **Create the Chat Widget Container**
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  document.body.appendChild(container);

  // ✅ **Define the HTML Structure for Ultron Chat**
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button">
      <div class="ultron-pulse"></div>
      <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" alt="Ultron" class="ultron-button-img">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">Ultron – AI Assistant</header>
      <div class="ultron-body" id="chatBody">
        <p>👋 Hi, I'm ULTRON. Your AI guide through the Helon universe.</p>
        <p>💡 Ask me anything about Helon, its vision, ecosystem, or tokens.<br>
           🔗 For official links, type "channels".</p>
        <p>🚀 The system is live. Discover the answers.</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here..." autocomplete="off">
        <button id="ultronSendButton">Send</button>
      </div>
    </div>
  `;

  // ✅ **Make Chat Button Visible After 3 Seconds**
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // ✅ **Toggle Widget Visibility on Button Click**
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  // ✅ **Attach Event Listener to Send Button**
  document.getElementById("ultronSendButton").addEventListener("click", sendChat);
  document.getElementById("chatInput").addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendChat();
  });

  // ✅ **Function to Send User Input to Ultron API**
  async function sendChat() {
    const input = document.getElementById("chatInput").value.trim();
    const chatBody = document.getElementById("chatBody");

    if (!input) return;

    // 🗣️ **Display User's Question**
    chatBody.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    document.getElementById("chatInput").value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // ✅ **Create API Payload**
    const payload = { question: input };
    console.log("🚀 Payload Sent:", JSON.stringify(payload));

    try {
      // ✅ **Send the Question to Ultron API**
      const response = await fetch('https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/server/logQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();

        // ✅ **Display Ultron's Response**
        if (data.answer) {
          chatBody.innerHTML += `<p><strong>Ultron:</strong> ${data.answer} <small>(Source: ${data.source})</small></p>`;
        } else {
          chatBody.innerHTML += `<p><strong>Ultron:</strong> Sorry, I couldn't find an answer. (Source: Ultron AI)</p>`;
        }
      } else {
        console.error("❌ Error Logging Question:", response.status);
        chatBody.innerHTML += `<p><strong>Ultron:</strong> Sorry, I'm having trouble processing your request.</p>`;
      }
    } catch (err) {
      console.error("❌ Network Error:", err);
      chatBody.innerHTML += `<p><strong>Ultron:</strong> Sorry, I couldn't connect to the server.</p>`;
    }
  }
})();