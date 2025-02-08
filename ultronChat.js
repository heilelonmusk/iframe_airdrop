// ultronChat.js
(function() {
  // Crea il contenitore per il chatbot se non esiste già
  let container = document.getElementById("ultronChatContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "ultronChatContainer";
    document.body.appendChild(container);
  }

  // Inietta il markup del widget di chat
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffcc00, #ffdd55);
      color: #000;
      border: none;
      font-size: 28px;
      cursor: pointer;
      z-index: 1100;
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;">
      🤖
    </button>
    <div id="ultronChatWidget" style="
      position: fixed;
      bottom: 100px;
      left: 20px;
      width: 320px;
      max-width: 90%;
      height: 400px;
      background: #1c1c1c;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 1100;
      animation: slideUp 0.5s ease;">
      <header style="
        background: linear-gradient(135deg, #ffcc00, #ffdd55);
        padding: 12px;
        font-weight: 600;
        color: #000;
        text-align: center;">
        Ultron – Heil Elon
      </header>
      <div class="chat-body" id="chatBody" style="
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        background: #2e2e2e;
        font-size: 14px;
        line-height: 1.5;">
        <p>Hello, I'm Ultron – your AI companion for the Helon project!</p>
        <p>How can I help you?</p>
        <p>Ask about <strong>who</strong>, <strong>what</strong>, <strong>where</strong>, <strong>when</strong>, or <strong>why</strong>.<br>
           Type "channels" for our community links.</p>
      </div>
      <div class="chat-input" style="
        display: flex;
        padding: 12px;
        background: #2e2e2e;">
        <input type="text" id="chatInput" placeholder="Type your question here..." style="
          flex: 1;
          padding: 8px;
          border: 1px solid #444;
          border-radius: 4px;
          font-size: 14px;
          background: transparent;
          color: white;
          outline: none;">
        <button onclick="sendChat()" style="
          margin-left: 8px;
          padding: 8px 12px;
          border: none;
          background: #ffcc00;
          color: #000;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;">Send</button>
      </div>
    </div>
  `;

  // Mostra il pulsante dopo 3 secondi
  setTimeout(() => {
    const btn = document.getElementById("ultronChatButton");
    btn.style.opacity = "1";
  }, 3000);

  // Toggle del widget di chat al clic del pulsante
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  // Funzione per processare le chat e rispondere (semplice logica di fallback)
  window.sendChat = async function() {
    const input = document.getElementById("chatInput");
    const question = input.value.trim();
    const chatBody = document.getElementById("chatBody");
    if (!question) return;
    chatBody.innerHTML += `<p style="color:#ffcc00;"><strong>You:</strong> ${question}</p>`;
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;
    
    let answer = "I'm sorry, I didn't understand that. Please ask about our channels or project details.";
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes("who")) {
      answer = "We are a dedicated team committed to decentralized interactions.";
    } else if (lowerQuestion.includes("what")) {
      answer = "Helon is a revolutionary project offering innovative airdrop opportunities.";
    } else if (lowerQuestion.includes("where")) {
      answer = "Visit our website at https://helon.space and join our Discord, Twitter, and Telegram channels.";
    } else if (lowerQuestion.includes("when")) {
      answer = "Final airdrop details will be announced by 23:59 CET on Feb. 28.";
    } else if (lowerQuestion.includes("why")) {
      answer = "We believe in empowering our community through decentralized solutions.";
    } else if (lowerQuestion.includes("channels")) {
      answer = "Our main channels are:<br>• Discord: https://discord.gg/helon<br>• Twitter: https://twitter.com/helonproject<br>• Telegram: https://t.me/helon";
    }
    
    chatBody.innerHTML += `<p style="color:lightblue;"><strong>Ultron:</strong> ${answer}</p>`;
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Effetto pulse come feedback visivo
    const widget = document.getElementById("ultronChatWidget");
    widget.style.transition = "box-shadow 0.5s ease";
    widget.style.boxShadow = "0 0 0 10px rgba(0,255,0,0.3)";
    setTimeout(() => {
      widget.style.boxShadow = "none";
    }, 500);
  };

  // Iniezione dello stile per l'animazione slideUp
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();