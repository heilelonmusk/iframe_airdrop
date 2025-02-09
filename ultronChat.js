(function() {
  if (window.self !== window.top) {
    return;
  }

  const isMobile = window.innerWidth <= 600;
  const buttonSize = isMobile ? "70px" : "90px";
  const imgSize = isMobile ? "70%" : "85%";
  const bottomOffset = isMobile ? "20px" : "80px";

  let container = document.getElementById("ultronChatContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "ultronChatContainer";
    container.style.position = "fixed";
    container.style.bottom = bottomOffset;
    container.style.right = "40px";  // Spostato leggermente più a sinistra
    container.style.zIndex = "1100";
    document.body.appendChild(container);
  }

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
    <div id="ultronChatWidget" class="ultron-widget" style="display: none;">
      <header class="ultron-header">Ultron – Heil Elon</header>
      <div class="ultron-body" id="chatBody">
        <p class="ultron-intro">Hi, here ULTRON. 🤖</p>
        <p class="ultron-intro">Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p class="ultron-intro">💡 Curious? Ask me anything about Helon, its vision, the ecosystem, or what’s next.<br>
           🔗 Need official links? Type “channels” to connect with the community.</p>
        <p class="ultron-intro">The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here...">
        <button onclick="sendChat()">Send</button>
      </div>
    </div>
  `;

  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = `
    .ultron-button {
      position: relative;
      overflow: visible;
    }
    .ultron-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,147,0,0.6) 0%, transparent 80%);
      animation: pulseGlow 1.5s infinite;
      top: 0;
      left: 0;
      z-index: -1;
    }
    @keyframes pulseGlow {
      0% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.6); opacity: 0.4; }
      100% { transform: scale(1); opacity: 0.6; }
    }
  `;
  document.head.appendChild(styleOverride);

  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });
})();
