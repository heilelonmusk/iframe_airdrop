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
    <button id="ultronChatButton" title="Chat with Ultron">
      <img src="https://heilelonmusk.github.io/iframe_airdrop/data/img/img_ultronai.png" alt="Ultron">
    </button>
    <div id="ultronChatWidget">
      <header>Ultron – Heil Elon</header>
      <div id="chatBody">
        <p>Hi, I'm ULTRON. 🤖 Ask me about Helon!</p>
      </div>
      <div>
        <input type="text" id="chatInput" placeholder="Type here..." />
        <button onclick="sendChat()">Send</button>
      </div>
    </div>
  `;

  document.getElementById("ultronChatButton").addEventListener("click", () => {
    document.getElementById("ultronChatWidget").classList.toggle("active");
  });

  window.sendChat = async function() {
    const input = document.getElementById("chatInput").value.trim();
    if (!input) return;
    
    document.getElementById("chatBody").innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    document.getElementById("chatInput").value = "";

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      const data = await response.json();
      document.getElementById("chatBody").innerHTML += `<p><strong>Ultron:</strong> ${data.answer || "Processing..."}</p>`;
    } catch (err) {
      console.error("❌ Chat Error:", err);
    }
  };
})();