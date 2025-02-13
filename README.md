# 🚀 Iframe Airdrop - AI Chat & Airdrop Checker

## 📌 Overview
Iframe Airdrop is an **AI-driven, serverless system** that integrates **airdrop verification** with an intelligent AI chatbot, **Ultron AI**. Originally designed for **Helon Airdrop Validation**, it has evolved into a scalable **NLP-powered assistant** capable of dynamic user interaction while ensuring secure and efficient API calls.

This document provides an in-depth analysis of the **architecture, functionality, troubleshooting methods, and development roadmap** for the system. It serves as a **technical reference** for developers and AI-driven automation processes maintaining and enhancing the system.

---

## 🔹 **System Architecture & Evolution**

### **1️⃣ Project Evolution & Key Milestones**
1. **Phase 1 - Airdrop Checker**: Implemented blockchain-based wallet verification.
2. **Phase 2 - AI Chatbot**: Introduced **Ultron AI**, leveraging **MongoDB** and **GPT-3.5/4** for enhanced responses.
3. **Phase 3 - Self-Learning AI**: Integrated **user feedback mechanisms** to refine NLP responses dynamically.
4. **Phase 4 - AI Expansion** *(Ongoing)*: Implementing **context memory, multi-intent handling, and deep learning modules**.
5. **Phase 5 - AI Security Enhancements**: Strengthening protections against abuse, spam, and API misuse.
6. **Phase 6 - AI Personalization & Dynamic Adaptation**: Enabling **custom AI behavior based on user preferences** and past interactions.

---

## 📂 **Project Structure**

### 🔹 **Backend (API & Database)**
| File                                 | Purpose                                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------------------|
| `api/server.js`                      | Manages API requests for chatbot & airdrop verification.                                |
| `api/logQuestion.js`                 | Logs user queries for **AI model training and analytics**.                              |
| `modules/nlp/transformer.js`         | Processes **AI-generated responses** using GPT-3.5/4.                                   |
| `modules/intent/intentRecognizer.js` | Classifies **user intent** to improve NLP performance.                                  |
| `api/seedKnowledge.js`               | Preloads MongoDB with **structured knowledge base**.                                   |
| `modules/security/rateLimiter.js`    | Implements API **rate limiting and abuse prevention**.                                  |
| `modules/cache/memoryCache.js`       | Caches frequent queries to **optimize API calls** and reduce latency.                   |
| `modules/logging/errorHandler.js`    | Handles API and AI **error logging and debugging tools**.                              |
| `modules/training/selfLearning.js`   | Manages **AI self-learning algorithms** based on user feedback.                         |
| `modules/conversation/contextHandler.js` | Implements **context-based conversation tracking** for better responses.         |
| `modules/ai_personalization/userProfiles.js` | Enables **personalized AI interactions** and behavior adjustments.                  |

### 🔹 **Frontend (Chat & UI)**
| File                             | Purpose                                                                                   |
|----------------------------------|-------------------------------------------------------------------------------------------|
| `iframe/airdrop_checker.js`      | Handles **wallet verification logic** for blockchain interactions.                        |
| `ultron_chat/ultronChat.js`      | Manages **user interactions with Ultron AI**.                                             |
| `ultron_chat/uiEnhancements.js`  | Enhances **UI/UX design**, accessibility, and real-time chat animations.                 |
| `ultron_chat/chatHistory.js`     | Implements **chat history tracking** for better AI continuity.                           |
| `ultron_chat/customThemes.js`    | Enables **theme customization** and **personalized chat UI**.                           |

### 🔹 **Configuration & Deployment**
| File                   | Purpose                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| `.env`                 | Stores **API keys & MongoDB credentials**. 🚨 **Sensitive—Keep it private!**              |
| `netlify.toml`         | Configures **Netlify routing, API headers, and CORS policies**.                           |
| `Dockerfile`           | Enables **containerized deployment** for enhanced scalability and reliability.            |
| `config/loggerConfig.js` | Manages **logging levels, error tracking, and debugging tools**.                     |
| `config/securityConfig.js` | Handles **authentication, API key validation, and user role management**.         |
| `config/themeSettings.js` | Stores **custom chat themes and personalized user experience preferences**.          |

---

## 🛠 **Troubleshooting & Debugging Guide** 🛠️

This section provides a **detailed list of common issues**, their **causes**, and the **step-by-step solutions** required to resolve them. Additionally, it includes **proactive measures** to prevent future problems.

### **1️⃣ API & Server Issues**
📌 **Issue: API not responding or returning 500 errors**
✅ **Solution:**
- Check **server logs** for error messages:
  ```bash
  npm run logs
  ```
- Verify that `server.js` is running and listening on the correct port.
- Restart the API server:
  ```bash
  npm start
  ```
- Check MongoDB connection **(see database issues below).**

📌 **Issue: CORS policy blocking API requests**
✅ **Solution:**
- Modify `netlify.toml` to allow CORS for frontend requests:
  ```toml
  [[headers]]
    for = "/api/*"
    [headers.values]
      Access-Control-Allow-Origin = "*"
  ```
- Restart **Netlify functions** after making changes.

### **2️⃣ Database & MongoDB Issues**
📌 **Issue: MongoDB connection failure (`MongooseServerSelectionError`)**
✅ **Solution:**
- Ensure `.env` contains the correct MongoDB connection string:
  ```env
  MONGO_URI=mongodb+srv://your_connection_string
  ```
- Check MongoDB **whitelisted IP addresses** and add your server’s IP.
- Manually test database connection:
  ```bash
  mongosh "your_connection_string"
  ```

📌 **Issue: AI chatbot returning `[object Object]`**
✅ **Solution:**
- Ensure responses are serialized correctly in `server.js`:
  ```javascript
  res.json({ response: typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse) });
  ```
- Check **MongoDB stored responses** to ensure they are saved as **flattened JSON strings**.

📌 **Issue: Rate limiter blocks valid users too frequently**
✅ **Solution:**
- Adjust rate-limiting configuration in `rateLimiter.js`:
  ```javascript
  app.use(rateLimit({ windowMs: 2 * 60 * 1000, max: 20 }));
  ```
- Implement **dynamic rate limits** based on user reputation.

---

## 📜 **Conclusion**
📌 **This document now serves as the single reference** for all **technical development, debugging, and AI enhancements** related to Iframe Airdrop & Ultron AI. It provides:
- ✅ **Full AI system architecture and detailed module breakdowns.**
- ✅ **Complete troubleshooting and debugging guides with proactive solutions.**
- ✅ **An in-depth roadmap for current and future AI-driven improvements.**

🚀 **This ensures all developers and AI automation processes can maintain and expand the system efficiently.**

