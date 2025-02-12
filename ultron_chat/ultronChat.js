(function () {
  if (window.self !== window.top) return;

  // Load the correct CSS file from GitHub
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.css"; // ✅ CORRECT PATH
  document.head.appendChild(style);

  // Create the chat container
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  container.style.position = "fixed";
  container.style.bottom = "80px";
  container.style.right = "40px";
  container.style.zIndex = "1100";
  document.body.appendChild(container);

  // Define the chat widget HTML
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button">
      <div class="ultron-pulse"></div>
      <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" 
           alt="Ultron" class="ultron-button-img">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">Ultron AI 🤖</header>
      <div class="ultron-body" id="chatBody">
        <p>Hi, I'm ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p>💡 Ask me anything about Helon, its vision, the ecosystem, or token details.<br>
           🔗 For official links, type “channels”.</p>
        <p>The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here...">
        <button id="ultronSendButton">Send</button>
      </div>
    </div>
  `;

  // Inject additional CSS styles
  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = `
    #ultronChatContainer, #ultronChatContainer * { font-family: inherit; }
    .ultron-button { position: relative; overflow: visible; }
    .ultron-pulse {
      position: absolute; width: 100%; height: 100%; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,147,0,0.7) 0%, transparent 75%);
      animation: pulseGlow 1.7s infinite; top: 0; left: 0; z-index: -1;
    }
    @keyframes pulseGlow {
      0% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.6); opacity: 0.4; }
      100% { transform: scale(1); opacity: 0.7; }
    }
  `;
  document.head.appendChild(styleOverride);

  // Reveal the chat button after 3 seconds
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // Toggle widget visibility
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = widget.style.display === "flex" ? "none" : "flex";
  });

  // Function to send a chat message to the backend
  document.getElementById("ultronSendButton").addEventListener("click", sendChat);

  async function sendChat() {
    const inputField = document.getElementById("chatInput");
    const userText = inputField.value.trim();
    if (!userText) return;

    const chatBody = document.getElementById("chatBody");
    chatBody.innerHTML += `<p class="user-message"><strong>You:</strong> ${userText}</p>`;
    inputField.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch('https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/logQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText })
      });

      if (response.ok) {
        const data = await response.json();
        chatBody.innerHTML += `<p class="bot-message"><strong>Ultron:</strong> ${data.answer || "I'm thinking... 🤖"}</p>`;
      } else {
        chatBody.innerHTML += `<p class="bot-message error-message">⚠️ Ultron AI is currently unavailable. Please try again later.</p>`;
      }
    } catch (error) {
      console.error("❌ Chat Error:", error);
      chatBody.innerHTML += `<p class="bot-message error-message">⚠️ Network error! Please check your connection.</p>`;
    }

    chatBody.scrollTop = chatBody.scrollHeight;
  }
})();