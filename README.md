# 🚀 iframe_airdrop - Airdrop Checker & Ultron AI Chat

## 📌 Overview
Originally developed for **Helon Airdrop Verification**, this project has expanded to include **Ultron AI Chat**, an intelligent assistant for user interactions. The system is designed for:
- **Airdrop Verification**: Users check if their wallet is eligible.
- **Ultron AI Chat**: Provides real-time responses using an evolving knowledge base.
- **Serverless Deployment**: Uses **Netlify Functions & MongoDB** for efficient backend operations.
- **Knowledge Base Integration**: Queries are checked against MongoDB before relying on OpenAI (GPT).
- **Machine Learning Enhancements**: The system continuously refines responses based on past interactions.

---

## 📂 **Project Structure**

### 🔹 **Backend (API & Database)**
| File                          | Purpose |
|--------------------------------|---------|
| `api/server.js`               | Main **Express API** handling chat & airdrop logic. |
| `api/logQuestion.js`          | Logs user queries to track **knowledge gaps** and refine responses. |
| `api/externalTokenListingUpdate.js` | Fetches live **token data** via API. |
| `api/seedKnowledge.js`        | **Preloads MongoDB** with structured knowledge for Ultron AI. |
| `modules/nlp/transformer.js`  | AI **response generation** using OpenAI's API (GPT-3.5/4). |
| `modules/intent/intentRecognizer.js` | Classifies **user intent** to provide more accurate responses. |

### 🔹 **Frontend (Chat & UI)**
| File                          | Purpose |
|--------------------------------|---------|
| `iframe/airdrop_checker.js`   | **Airdrop verification** logic for wallet checks. |
| `iframe/airdrop_checker.html` | UI for **wallet verification** and user interactions. |
| `ultron_chat/ultronChat.js`   | **Ultron AI Chat UI** & communication logic. |
| `ultron_chat/ultronChat.css`  | Chat **styles, animations, and layout**. |

### 🔹 **Configuration & Deployment**
| File                          | Purpose |
|--------------------------------|---------|
| `.env`                        | **Stores API keys & MongoDB credentials**. 🚨 Keep this private! |
| `netlify.toml`                | **Netlify configuration** (API routing & CORS headers). |
| `package.json`                | Lists project dependencies (Express, Mongoose, OpenAI, etc.). |

---

## 🛠 **Installation & Setup**

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/heilelonmusk/iframe_airdrop.git
cd iframe_airdrop
```
### **2️⃣ Install Dependencies**
```bash
npm install  # or yarn install
```
### **3️⃣ Set Up Environment Variables**
- Create a `.env` file with:
```env
MONGO_URI=mongodb+srv://your_connection_string
OPENAI_API_KEY=your_openai_key
NETLIFY_FUNCTIONS_PATH=./netlify/functions
```
### **4️⃣ Start Development Server**
```bash
npm start
```

---

## 📢 **AI & Machine Learning Integration**
### 🔹 Current Features
- **Knowledge Base Querying**: Ultron AI first checks MongoDB before using OpenAI API.
- **Intent Recognition**: User queries are classified for better response accuracy.
- **Secure API Calls**: GPT-powered responses are **rate-limited** to prevent abuse.

### 🔮 **Planned Upgrades**
- **Dynamic Learning**: AI will refine responses based on **user interactions**.
- **Knowledge Expansion**: Auto-fetching data from APIs, RSS feeds, and user-generated content.
- **NLP Enhancements**: More advanced chatbot capabilities with **context retention**.

---

## ⚠️ **Common Issues & Fixes**
| Issue                        | Solution |
|------------------------------|----------|
| API CORS Errors               | Adjust `Access-Control-Allow-Origin` in `netlify.toml`. |
| MongoDB Connection Issues     | Ensure `MONGO_URI` is **correctly set in Netlify**. |
| OpenAI API Errors             | Verify API key and available token limits. |
| Rate-Limiting Blocked Requests | Adjust limits in `express-rate-limit`. |
| Netlify Function Fails (502)  | Ensure functions are correctly **deployed & built**. |

---

## 🎯 **Contributing**
Want to help?
1. Fork the repo
2. Create a new branch (`feature-xyz`)
3. Submit a Pull Request

---

## 📝 **License**
This project is licensed under **MIT License**. See `LICENSE` for details.
```

