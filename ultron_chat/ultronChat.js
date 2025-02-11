document.addEventListener("DOMContentLoaded", function () {
    console.log("Ultron Chat Initialized");

    const chatContainer = document.createElement("div");
    chatContainer.id = "ultron-chat-container";
    document.body.appendChild(chatContainer);

    // Add Chat Icon
    chatContainer.innerHTML = `
        <div id="ultron-chat-icon">
            <img src="https://heilelonmusk.github.io/iframe_airdrop/ultron_chat/ultronChat.png" alt="Ultron Chat">
        </div>
        <div id="ultron-chat-window">
            <div id="ultron-chat-header">
                Ultron Chat
                <button id="ultron-close-btn">✖</button>
            </div>
            <div id="ultron-chat-messages"></div>
            <div id="ultron-chat-input">
                <input type="text" id="ultron-user-input" placeholder="Type a message..." />
                <button id="ultron-send-btn">Send</button>
            </div>
        </div>
    `;

    const chatIcon = document.getElementById("ultron-chat-icon");
    const chatWindow = document.getElementById("ultron-chat-window");
    const closeButton = document.getElementById("ultron-close-btn");
    const sendButton = document.getElementById("ultron-send-btn");
    const userInput = document.getElementById("ultron-user-input");
    const messagesDiv = document.getElementById("ultron-chat-messages");

    if (!chatIcon || !chatWindow || !sendButton || !userInput || !messagesDiv || !closeButton) {
        console.error("Ultron Chat: Elements not found!");
        return;
    }

    chatWindow.style.display = "none"; // Hide chat initially

    // Toggle Chat Window
    chatIcon.addEventListener("click", function () {
        chatWindow.style.display = chatWindow.style.display === "none" ? "block" : "none";
    });

    // Close Chat Window
    closeButton.addEventListener("click", function () {
        chatWindow.style.display = "none";
    });

    // Send message when clicking the send button
    sendButton.addEventListener("click", sendMessage);

    // Send message when pressing Enter
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        const userMessage = userInput.value.trim();
        if (userMessage === "") return;

        // Append user message
        appendMessage(userMessage, "ultron-user-message");

        // Simulate bot response
        setTimeout(() => {
            const botResponse = getBotResponse(userMessage);
            appendMessage(botResponse, "ultron-bot-message");
        }, 1000);

        userInput.value = ""; // Clear input field
    }

    function appendMessage(text, className) {
        const messageDiv = document.createElement("div");
        messageDiv.className = className;
        messageDiv.textContent = text;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll
    }

    function getBotResponse(input) {
        // Basic predefined responses (this can be connected to a real AI later)
        const responses = {
            "hello": "Hi there! How can I assist you?",
            "who are you": "I'm Ultron AI, here to help!",
            "help": "Sure! What do you need help with?",
            "dymension": "Dymension is an ecosystem supporting modular blockchain rollups!",
            "default": "I'm not sure about that. Try asking something else!"
        };

        const lowerInput = input.toLowerCase();
        return responses[lowerInput] || responses["default"];
    }
});