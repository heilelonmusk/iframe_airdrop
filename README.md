# 🚀 iframe_airdrop - Airdrop Checker & Ultron AI Chat

## 📌 Overview
Originally developed for **Helon Airdrop Verification**, this project has expanded to include an **Ultron AI Chatbot**. The system is designed for:
- **Airdrop Verification**: Users check if their wallet is eligible.
- **Ultron AI Chat**: Provides real-time responses & support.
- **Serverless Deployment**: Uses **Netlify Functions & MongoDB**.
- **Machine Learning Integration** (planned for future updates).

---
## 📂 **Project Structure**

### 🔹 **Backend (API & Database)**
| File                          | Purpose |
|--------------------------------|---------|
| `api/server.js`               | Main **Express API** for chat and airdrop logic. |
| `api/logQuestion.js`          | Logs user queries to track **knowledge gaps**. |
| `api/externalTokenListingUpdate.js` | Fetches live **token data** via API. |
| `api/seedKnowledge.js`        | **Populates MongoDB** with initial AI knowledge. |

### 🔹 **Frontend (Chat & UI)**
| File                          | Purpose |
|--------------------------------|---------|
| `iframe/airdrop_checker.js`   | **Airdrop verification** logic. |
| `iframe/airdrop_checker.html` | UI for wallet verification. |
| `ultron_chat/ultronChat.js`   | **Chat system UI** for Ultron AI. |
| `ultron_chat/ultronChat.css`  | Chat **styles & animations**. |

### 🔹 **Configuration & Deployment**
| File                          | Purpose |
|--------------------------------|---------|
| `.env`                        | **Stores API keys & MongoDB credentials**. 🚨 Keep this private! |
| `netlify.toml`                | **Netlify settings** (API routing & CORS headers). |
| `package.json`                | Lists project dependencies (Express, Mongoose, Serverless). |

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
NETLIFY_FUNCTIONS_PATH=./netlify/functions
```
### **4️⃣ Start Development Server**
```bash
npm start
```

---
## 📢 **AI & Machine Learning Integration**
Planned upgrades:
- **Dynamic Learning**: AI will refine responses based on **user interactions**.
- **Knowledge Expansion**: Auto-fetching new data for real-time **crypto insights**.
- **NLP Enhancements**: More advanced chatbot capabilities with **deep learning**.

---
## ⚠️ **Common Issues & Fixes**
| Issue                        | Solution |
|------------------------------|----------|
| API CORS Errors               | Adjust `Access-Control-Allow-Origin` in `netlify.toml`. |
| MongoDB Connection Issues     | Ensure `MONGO_URI` is **correctly set in Netlify**. |
| Netlify Function Fails (502)  | Use `serverless-http` in `server.js` correctly. |

---
## 🎯 **Contributing**
Want to help?
1. Fork the repo
2. Create a new branch (`feature-xyz`)
3. Submit a Pull Request

---
## 📜 **License**
This project is licensed under **MIT License**. See `LICENSE` for details.

