# 🚀 Iframe Airdrop - Airdrop Checker & Ultron AI Chat

## 📌 Overview
Originally developed for **Helon Airdrop Verification**, the **Iframe Airdrop** project has evolved into an **AI-driven, serverless architecture** supporting both **airdrop eligibility checks** and an **AI-powered chatbot**, **Ultron AI**. 

### 🔥 Evolution of the Project
1. **Phase 1: Airdrop Checker** – Initially, the project was a **simple verification tool** for Helon’s airdrop eligibility.
2. **Phase 2: AI Chatbot Integration** – **Ultron AI** was added to enhance **user interactions** with a dynamic chatbot.
3. **Phase 3: NLP & Machine Learning** – The chatbot was upgraded to **query a structured knowledge base** before relying on GPT.
4. **Phase 4: Auto-Learning & AI Refinements** *(Ongoing)* – AI responses **evolve** based on **user feedback and real-time data ingestion**.

### 🎯 **Core Functionalities**
- **Airdrop Eligibility Checks**: Users input their wallet address to verify eligibility.
- **Ultron AI Chat**: An evolving chatbot powered by **NLP**, **knowledge base lookups**, and **GPT-3.5/4**.
- **Knowledge Base System**: MongoDB stores structured knowledge before API fallback.
- **Serverless Deployment**: Uses **Netlify Functions & MongoDB Atlas** for scalability.
- **Machine Learning Refinements**: AI continuously **learns from new queries** to improve responses.

---

## 📂 **Project Structure**

### 🔹 **Backend (API & Database)**
| File                          | Purpose |
|--------------------------------|---------|
| `api/server.js`               | Main **Express API** handling chat & airdrop logic. |
| `api/logQuestion.js`          | Logs user queries for AI training and analytics. |
| `api/externalTokenListingUpdate.js` | Fetches **live token data** from external APIs. |
| `api/seedKnowledge.js`        | **Preloads MongoDB** with structured knowledge. |
| `modules/nlp/transformer.js`  | AI **response generation** using OpenAI's API. |
| `modules/intent/intentRecognizer.js` | **Intent classification** to enhance chatbot precision. |

### 🔹 **Frontend (Chat & UI)**
| File                          | Purpose |
|--------------------------------|---------|
| `iframe/airdrop_checker.js`   | **Airdrop verification logic** for wallet checks. |
| `iframe/airdrop_checker.html` | UI for **wallet verification** and user interactions. |
| `ultron_chat/ultronChat.js`   | **Ultron AI Chat UI** & frontend logic. |
| `ultron_chat/ultronChat.css`  | Chat **styles, animations, and layout**. |

### 🔹 **Configuration & Deployment**
| File                          | Purpose |
|--------------------------------|---------|
| `.env`                        | **Stores API keys & MongoDB credentials**. 🚨 Keep this private! |
| `netlify.toml`                | **Netlify configuration** (API routing & CORS headers). |
| `package.json`                | Lists project dependencies (Express, Mongoose, OpenAI, etc.). |

---

## 📢 **AI & Machine Learning Integration**
### 🔹 Implemented Features
- **NLP-Based Intent Recognition**: Classifies queries before fetching responses.
- **Knowledge Base Querying**: MongoDB stores answers, reducing GPT API calls.
- **AI Refinement System**: New user queries are **stored and reviewed for model retraining**.
- **Rate-Limited GPT Responses**: Prevents **abuse and excessive token consumption**.

### 🔮 **Upcoming Enhancements**
- **Self-Learning Model**: AI adapts answers based on **user feedback & query frequency**.
- **Real-Time Data Fetching**: Expanding knowledge through **API & RSS feeds**.
- **Advanced Memory & Context Handling**: Implementing **session-based memory** for smarter responses.

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

## 📝 **License**
This project is licensed under **MIT License**. See `LICENSE` for details.
