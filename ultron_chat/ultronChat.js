(function () {
  if (window.self !== window.top) return;

  // ✅ Load CSS dynamically from GitHub
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.css";
  document.head.appendChild(style);

  // ✅ Create chat container
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  document.body.appendChild(container);

  // ✅ Chat Widget HTML
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button">
      <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" alt="Ultron">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">Ultron – Heil Elon</header>
      <div class="ultron-body" id="chatBody">
        <p>Hi, I'm ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here...">
        <button id="ultronSendButton">Send</button>
      </div>
    </div>
  `;

  // ✅ Show icon after 3 seconds
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // ✅ Handle click event for chat visibility
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.classList.toggle("show");
  });

  // ✅ Send message function
  document.getElementById("ultronSendButton").addEventListener("click", sendChat);

  async function sendChat() {
    const input = document.getElementById("chatInput").value.trim();
    const chatBody = document.getElementById("chatBody");
    if (!input) return;

    chatBody.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    document.getElementById("chatInput").value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch('https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/server/logQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      if (response.ok) {
        const data = await response.json();
        chatBody.innerHTML += `<p><strong>Ultron:</strong> ${data.answer}</p>`;
      } else {
        console.error("❌ Error logging question:", response.status);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
    }
  }
})();