(function() {
  if (window.self !== window.top) {
    console.log("Ultron Chat is not injected in an iframe context.");
    return;
  }

  // Determina le dimensioni in base al dispositivo
  const isMobile = window.innerWidth <= 600;
  const buttonSize = isMobile ? "75px" : "95px";  // Mobile: 75px, Desktop: 95px
  const imgSize = isMobile ? "70%" : "85%"; // Più visibile
  const bottomOffset = isMobile ? "20px" : "80px";

  // Sposta il bottone leggermente a sinistra (prima era right: 20px, ora 40px)
  const rightOffset = isMobile ? "40px" : "40px";

  // Crea il container per il chatbot se non esiste già
  let container = document.getElementById("ultronChatContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "ultronChatContainer";
    container.style.position = "fixed";
    container.style.bottom = bottomOffset;
    container.style.right = rightOffset;
    container.style.zIndex = "1100";
    document.body.appendChild(container);
  }

  // Inietta il markup del widget di chat
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button" style="
      width: ${buttonSize};
      height: ${buttonSize};
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9300, #ff9300);
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      position: relative;">
      <div class="ultron-pulse"></div>
      <img src="https://heilelonmusk.github.io/iframe_airdrop/data/img/img_ultronai.png" 
        alt="Ultron" class="ultron-button-img" 
        style="width: ${imgSize}; height: ${imgSize}; border-radius: 50%; position: absolute; top: 10%; left: 10%;">
    </button>
    <div id="ultronChatWidget" class="ultron-widget" style="
      width: 320px;
      max-width: 90%;
      height: 400px;
      background: #1c1c1c;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
      flex-direction: column;
      overflow: hidden;
      margin-top: 10px;">
      <header class="ultron-header" style="
        background: linear-gradient(135deg, #ff9300, #ff9300);
        padding: 12px;
        font-weight: 600;
        color: white !important;
        text-align: center;">
        Ultron – Heil Elon
      </header>
      <div class="ultron-body" id="chatBody" style="
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        background: #2e2e2e;
        font-size: 14px;
        line-height: 1.5;
        color: white !important;">
        <p class="ultron-intro">Hi, here ULTRON. 🤖</p>
        <p class="ultron-intro">Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p class="ultron-intro">💡 Curious? Ask me anything about Helon, its vision, the ecosystem, or what’s next.<br>
           🔗 Need official links? Type “channels” to connect with the community.</p>
        <p class="ultron-intro">The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input" style="
        display: flex;
        padding: 12px;
        background: #2e2e2e;">
        <input type="text" id="chatInput" placeholder="Type your question here..." class="ultron-input-field" style="
          flex: 1;
          padding: 8px;
          border: 1px solid #444;
          border-radius: 4px;
          font-size: 14px;
          background: transparent;
          color: white !important;
          outline: none;">
        <button onclick="sendChat()" class="ultron-send-button" style="
          margin-left: 8px;
          padding: 8px 12px;
          border: none;
          background: #ff9300;
          color: #000;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;">Send</button>
      </div>
    </div>
  `;

  // Iniezione di regole CSS per l'effetto pulse migliorato
  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = `
    #ultronChatContainer, #ultronChatContainer * {
      color: white !important;
      font-family: inherit;
    }
    /* Pulsing glow halo migliorato */
    .ultron-button {
      position: relative;
      overflow: visible;
    }
    .ultron-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,147,0,0.9) 0%, transparent 80%);
      animation: pulseGlow 1.5s infinite;
      top: 0;
      left: 0;
      z-index: -1;
    }
    @keyframes pulseGlow {
      0% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(2.2); opacity: 0.5; }
      100% { transform: scale(1); opacity: 0.9; }
    }
  `;
  document.head.appendChild(styleOverride);

  // Mostra il pulsante di chat dopo 3 secondi
  setTimeout(() => {
    const btn = document.getElementById("ultronChatButton");
    btn.style.opacity = "1";
  }, 3000);

  // Toggle del widget di chat al clic del pulsante
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

})();
