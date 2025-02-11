document.addEventListener("DOMContentLoaded", function () {
  const chatIcon = document.getElementById("ultron-chat-icon");
  const chatWindow = document.getElementById("ultron-chat-window");

  if (!chatIcon || !chatWindow) {
      console.error("Ultron Chat: Elements not found!");
      return;
  }

  // Toggle Chat Window
  chatIcon.addEventListener("click", function () {
      if (chatWindow.style.display === "none" || chatWindow.style.display === "") {
          chatWindow.style.display = "block";
      } else {
          chatWindow.style.display = "none";
      }
  });

  // Send message when clicking the send button
  document.getElementById("ultron-send-btn").addEventListener("click", sendMessage);

  function sendMessage() {
      const userInput = document.getElementById("ultron-user-input").value.trim();
      if (userInput === "") return;

      const messagesDiv = document.getElementById("ultron-chat-messages");

      // Append user message
      const userMessage = document.createElement("div");
      userMessage.className = "ultron-user-message";
      userMessage.textContent = userInput;
      messagesDiv.appendChild(userMessage);

      // Scroll to latest message
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Simulate bot response
      setTimeout(() => {
          const botMessage = document.createElement("div");
          botMessage.className = "ultron-bot-message";
          botMessage.textContent = "I'm Ultron! How can I help you?";
          messagesDiv.appendChild(botMessage);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }, 1000);

      // Clear input field
      document.getElementById("ultron-user-input").value = "";
  }
});