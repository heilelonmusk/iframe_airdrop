(function() {
  // Se lo script viene eseguito in un iframe, non eseguirlo (il widget deve essere iniettato solo nel top window)
  if (window.self !== window.top) {
    console.log("Ultron Chat is not injected in an iframe context.");
    return;
  }

  // Crea il container globale per il chatbot se non esiste già
  let container = document.getElementById("ultronChatContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "ultronChatContainer";
    // Usa classi per il posizionamento; lascia che il CSS globale le gestisca
    container.className = "ultron-container";
    document.body.appendChild(container);
  }

  // Inietta il markup del widget di chat nel container
  container.innerHTML = `
    <button id="ultronChatButton" title="Chat with Ultron" class="ultron-button">
      <img src="https://heilelonmusk.github.io/iframe_airdrop/data/img/img_ultronai.png" alt="Ultron" class="ultron-button-img">
    </button>
    <div id="ultronChatWidget" class="ultron-widget">
      <header class="ultron-header">
        Ultron – Heil Elon
      </header>
      <div class="ultron-body" id="chatBody">
        <p class="ultron-intro">Hi, here ULTRON. 🤖</p>
        <p class="ultron-intro">Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
        <p class="ultron-intro">💡 Curious? Ask me anything about Helon, its vision, the ecosystem, or what’s next.<br>
           🔗 Need official links? Type “channels” to connect with the community.</p>
        <p class="ultron-intro">The system runs. The answers are yours to uncover. 🚀</p>
      </div>
      <div class="ultron-input">
        <input type="text" id="chatInput" placeholder="Type your question here..." class="ultron-input-field">
        <button onclick="sendChat()" class="ultron-send-button">Send</button>
      </div>
    </div>
  `;

  // Iniezione di una regola CSS per forzare il colore bianco in modo che ereditino lo stile del sito di Hostinger
  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = `
    #ultronChatContainer, #ultronChatContainer * {
      color: white !important;
      font-family: inherit;
    }
  `;
  document.head.appendChild(styleOverride);

  // Mostra il pulsante di chat dopo 3 secondi
  setTimeout(() => {
    document.getElementById("ultronChatButton").style.opacity = "1";
  }, 3000);

  // Toggle del widget di chat al clic del pulsante
  document.getElementById("ultronChatButton").addEventListener("click", () => {
    const widget = document.getElementById("ultronChatWidget");
    widget.style.display = (widget.style.display === "flex") ? "none" : "flex";
  });

  // Funzione per processare le chat e generare risposte
  window.sendChat = async function() {
    const input = document.getElementById("chatInput");
    const question = input.value.trim();
    const chatBody = document.getElementById("chatBody");
    if (!question) return;
    chatBody.innerHTML += `<p class="ultron-user"><strong>You:</strong> ${question}</p>`;
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
    
    chatBody.innerHTML += `<p class="ultron-response"><strong>Ultron:</strong> ${answer}</p>`;
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
  const slideStyle = document.createElement('style');
  slideStyle.innerHTML = `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(slideStyle);
})();
