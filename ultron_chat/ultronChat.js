(function() {
  if (window.self !== window.top) return;

  // Create the chat container
  const container = document.createElement("div");
  container.id = "ultronChatContainer";
  container.style.position = "fixed";
  container.style.bottom = "80px";
  container.style.right = "40px";
  container.style.zIndex = "1100";
  document.body.appendChild(container);

  // Set up the HTML structure for the chat widget
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button" style="
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9300, #ff9300);
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      position: relative;">
      <div class="ultron-pulse"></div>
      <img src="https://heilelonmusk.github.io/iframe_airdrop/data/img/img_ultronai.png" 
           alt="Ultron" class="ultron-button-img" style="
           width: 85%; height: 85%; border-radius: 50%; position: absolute; top: 10%; left: 10%;">
    </button>
    <div id="ultronChatWidget" class="ultron-widget" style="
      width: 320px; max-width: 90%; height: 400px;
      background: #1c1c1c; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none; flex-direction: column; overflow: hidden; margin-top: 10px;">
      <header class="ultron-header" style="
        background: linear-gradient(135deg, #ff9300, #ff9300);
        padding: 12px; font-weight: 600; color: white; text-align: center;">
        Ultron – Heil Elon
      </header>
      <div class="ultron-body" id="chatBody" style="
        flex: 1; padding: 12px; overflow-y: auto;
        background: #2e2e2e; font-size: 14px; line-height: 1.5; color: white;">
        <p>Hi, I'm ULTRON. 🤖</p>
        <p>Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p>💡 Ask me anything about Helon, its vision, the ecosystem or token details.<br>
           🔗 For official links, type “channels”.</p>
        <p>The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input" style="
        display: flex; padding: 12px; background: #2e2e2e;">
        <input type="text" id="chatInput" placeholder="Type your question here..." style="
          flex: 1; padding: 8px; border: 1px solid #444; border-radius: 4px;
          font-size: 14px; background: transparent; color: white; outline: none;">
        <button onclick="sendChat()" style="
          margin-left: 8px; padding: 8px 12px; border: none;
          background: #ff9300; color: #000; font-weight: bold; border-radius: 4px;
          cursor: pointer; transition: background 0.3s;">Send</button>
      </div>
    </div>
  `;

  // Inject additional styles
  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = `
    #ultronChatContainer, #ultronChatContainer * {
      color: white !important;
      font-family: inherit;
    }
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

  // Show the chat button after a delay
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // Toggle widget visibility on button click
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  // Send chat function: sends a question to the serverless function and handles the response
  window.sendChat = async function() {
    const input = document.getElementById("chatInput").value.trim();
    const chatBody = document.getElementById("chatBody");
    if (!input) return;
    
    // Append user message to chat
    chatBody.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    document.getElementById("chatInput").value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch('/.netlify/functions/logQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.answer) {
          chatBody.innerHTML += `<p><strong>Ultron:</strong> ${data.answer} <small>(Source: ${data.source})</small></p>`;
        } else {
          chatBody.innerHTML += `<p><strong>Ultron:</strong> This is an interesting question! 🚀 I'm gathering information, please try again later.</p>`;
        }
      } else {
        console.error("Error logging question:", response.status);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };
})();
