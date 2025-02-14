# 📌 Iframe Airdrop - AI-Driven Airdrop Verification System

## 🏗️ Table of Contents
1. [Introduction](#introduction)
2. [Project Overview](#project-overview)
3. [Iframe Usage](#iframe-usage)
4. [AI-Powered Ultron Chat](#ai-powered-ultron-chat)
5. [Technologies Used](#technologies-used)
6. [How to Use](#how-to-use)
7. [Setup Guide](#setup-guide)
8. [Endpoints](#endpoints)
9. [Contributors & Acknowledgments](#contributors--acknowledgments)

---

## 🔹 Introduction
Iframe Airdrop is a **fully automated, serverless system** designed to seamlessly integrate **airdrop verification** with an **AI chatbot assistant** called **Ultron AI**. The system is designed to streamline airdrop validation, optimize real-time user interactions, and provide enhanced **security** using NLP-powered verification.

The project was initially designed for **Helon Airdrop Validation** but has since evolved into a **scalable and AI-driven assistant** capable of real-time blockchain verification and secure user interactions.

---

## 🔹 Project Overview
Iframe Airdrop leverages a combination of:
- **MongoDB** for dynamic user interactions and AI knowledge storage.
- **Netlify Functions** for scalable and serverless execution.
- **GitHub Integration** for version-controlled data retrieval.
- **Ultron AI Chat** for **AI-powered airdrop verification.**

The core functionalities include:
- **Seamless airdrop verification** via an AI chatbot.
- **Real-time database queries** to validate user interactions.
- **Efficient data retrieval** from **GitHub, Netlify, and MongoDB.**
- **Automated processing** to minimize human intervention in airdrop validation.

---

## 🔹 Iframe Usage
Iframe Airdrop is embedded using an **iframe-based architecture**, allowing seamless integration with **any frontend**. This ensures the airdrop system can be deployed inside existing **dApps, wallets, and verification platforms** without requiring full backend integration.

Iframe allows for **cross-platform compatibility**, making it easy to integrate the airdrop verification UI into any third-party application.

---

## 🔹 AI-Powered Ultron Chat

**Ultron AI** is the advanced chatbot that interacts with users to **validate airdrop claims**.

### Features:
✅ AI-powered **airdrop eligibility checks**.
✅ **Natural Language Processing (NLP)** to handle user interactions.
✅ Secure **MongoDB-backed data storage** for query optimization.
✅ **Real-time** API responses for an enhanced user experience.

Ultron AI will continue to evolve with **more AI models** and **expanded datasets**, making it a **self-learning** verification assistant.

---

## 🔹 Technologies Used
- **Node.js & Express**: Backend API logic
- **Serverless (Netlify Functions)**: Scalable architecture
- **MongoDB**: Data persistence and AI knowledge storage
- **GitHub API**: Fetching and retrieving essential files
- **Netlify Hosting**: Web-based function execution
- **AI NLP Processing**: AI-powered chatbot verification

---

## 🔹 How to Use
1. **Embed Iframe** in your frontend:
   ```html
   <iframe src="https://your-netlify-site.netlify.app" width="100%" height="600px"></iframe>
   ```
2. Users interact with **Ultron AI Chat** to verify their airdrop status.
3. AI checks and **validates eligibility** using **MongoDB & GitHub data**.
4. Users receive a **confirmation or rejection message**.

---

## 🔹 Setup Guide
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/heilelonmusk/iframe_airdrop.git
cd iframe_airdrop
```
### 2️⃣ Install Dependencies
```bash
npm install
```
### 3️⃣ Configure Environment Variables
Create a `.env` file and add:
```
MONGO_URI=your_mongo_connection_string
GITHUB_OWNER=heilelonmusk
GITHUB_REPO=iframe_airdrop
MY_GITHUB_TOKEN=your_github_token
NETLIFY_URL=https://your-netlify-site.netlify.app
```
### 4️⃣ Deploy to Netlify
```bash
netlify deploy --prod
```

---

## 🔹 Endpoints
### ✅ **Fetch Data** from GitHub, MongoDB, or Netlify
`GET /.netlify/functions/unifiedAccess/fetch?source=github&file=README.md`

### ✅ **Store Data** into MongoDB
`POST /.netlify/functions/unifiedAccess/store`
**Payload:** `{ "key": "test_key", "value": "Hello MongoDB!" }`

### ✅ **Download File** from GitHub or Netlify
`GET /.netlify/functions/unifiedAccess/download?source=github&file=README.md`

---

## 🔹 Contributors & Acknowledgments
👤 **Helon Airdrop Team** - Original concept
👨‍💻 **Ultron AI Developers** - AI chatbot integration
💻 **Open Source Contributors** - Continuous improvements

