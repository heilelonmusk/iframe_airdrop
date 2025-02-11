(function() {
    if (window.self !== window.top) return;
  
    // Create the chat container
    const container = document.createElement("div");
    container.id = "ultron-chat-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1000";
    document.body.appendChild(container);
  
    // Define the chat widget HTML
    container.innerHTML = `
      <div id="ultron-chat-icon">
        <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" alt="Ultron">
      </div>
      <div id="ultron-chat-window">
        <div id="ultron-chat-header">
          Ultron – Heil Elon
          <button id="ultron-close-btn">&times;</button>
        </div>
        <div id="ultron-chat-messages">
          <p class="ultron-bot-message">Hi, I'm ULTRON. 🤖</p>
          <p class="ultron-bot-message">Your AI guide through the Helon universe—here to assist, navigate, and inform.</p>
          <p class="ultron-bot-message">💡 Ask me anything about Helon, its vision, the ecosystem, or token details.</p>
        </div>
        <div id="ultron-chat-input">
          <input type="text" id="ultron-user-input" placeholder="Type your question...">
          <button id="ultron-send-btn">Send</button>
        </div>
      </div>
    `;
  
    // Reveal the chat icon after 3 seconds
    setTimeout(() => {
      document.getElementById("ultron-chat-icon").style.opacity = "1";
    }, 3000);
  
    // Chat button click event
    document.getElementById("ultron-chat-icon").addEventListener("click", () => {
      document.getElementById("ultron-chat-window").style.display = "block";
    });
  
    // Close button event
    document.getElementById("ultron-close-btn").addEventListener("click", () => {
      document.getElementById("ultron-chat-window").style.display = "none";
    });
  
    // Send message function
    document.getElementById("ultron-send-btn").addEventListener("click", async () => {
      const inputField = document.getElementById("ultron-user-input");
      const message = inputField.value.trim();
      if (!message) return;
  
      const chatBody = document.getElementById("ultron-chat-messages");
      chatBody.innerHTML += `<p class="ultron-user-message">You: ${message}</p>`;
      inputField.value = "";
      chatBody.scrollTop = chatBody.scrollHeight;
  
      try {
        const response = await fetch('/.netlify/functions/logQuestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: message })
        });
  
        if (response.ok) {
          const data = await response.json();
          if (data.answer) {
            chatBody.innerHTML += `<p class="ultron-bot-message">Ultron: ${data.answer}</p>`;
          } else {
            chatBody.innerHTML += `<p class="ultron-bot-message">Ultron: I’m still learning, try again later!</p>`;
          }
        } else {
          console.error("Error logging question:", response.status);
        }
      } catch (err) {
        console.error("Network error:", err);
      }
    });
  })();