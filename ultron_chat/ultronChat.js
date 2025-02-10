(function() {
  if (window.self !== window.top) return;

  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  container.style.position = "fixed";
  container.style.bottom = "80px";
  container.style.right = "40px";
  container.style.zIndex = "1100";
  document.body.appendChild(container);

  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron">🤖</button>
    <div id="ultronChatWidget">
      <header>Ultron – Heil Elon</header>
      <div class="chat-body" id="chatBody">
        <p>Hi, here ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
      </div>
      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="Type your question here...">
        <button onclick="sendChat()">Send</button>
      </div>
    </div>
  `;

  async function sendChat() {
    const input = document.getElementById("chatInput").value.trim();
    const chatBody = document.getElementById("chatBody");
    chatBody.innerHTML += `<p><strong>You:</strong> ${input}</p>`;

    fetch("https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/logQuestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
  }
})();
