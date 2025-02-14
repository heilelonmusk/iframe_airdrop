# 🚀 Iframe Airdrop - AI Chat & Airdrop Checker

## 📌 Overview
Iframe Airdrop is an **AI-driven, serverless system** that integrates **airdrop verification** with an intelligent AI chatbot, **Ultron AI**. Originally designed for **Helon Airdrop Validation**, it has evolved into a **highly modular, scalable, and self-learning NLP-powered assistant** capable of dynamic user interaction while ensuring **secure and efficient API calls**. The project integrates **MongoDB, Netlify, and GitHub Actions**, making it a fully **automated, cloud-based** solution that manages real-time user interactions, database queries, and blockchain verification processes.

This document serves as the **definitive reference** for the system’s **architecture, functionality, AI integration, database structure, API logic, troubleshooting methods, deployment pipeline, and development roadmap**. It provides **detailed insights** into how each component interacts and how developers can contribute to future improvements.

### 🔗 **Related Documentation**:
- **[AI Developer Notes](./AI_DEVELOPER_NOTES.md)** - Comprehensive analysis of **NLP processing, chatbot logic, AI learning algorithms, and real-time optimizations**.
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Exhaustive debugging manual covering **API failures, database inconsistencies, AI response issues, and infrastructure troubleshooting**.
- **[Project File Tree](./file_tree.txt)** - Auto-generated **structural index** of all project files and their purposes, dynamically maintained with automation scripts.

---
## 🛡️ **System Architecture & Evolution**

### **1️⃣ Project Evolution & Key Milestones**
1. **Phase 1 - Airdrop Checker**: Implemented **wallet validation** through blockchain-based verification APIs for Ethereum, Solana, and Binance Smart Chain.
2. **Phase 2 - AI Chatbot**: Integrated **Ultron AI**, leveraging **MongoDB**, **GPT-3.5/4**, and a custom-built NLP **intent recognition engine**.
3. **Phase 3 - Self-Learning AI**: Introduced **feedback-driven AI training loops**, allowing **real-time model adjustments** based on user input.
4. **Phase 4 - AI Expansion (Ongoing)**: Enhancing **multi-intent processing, long-term conversational memory, and deep learning-based reasoning**.
5. **Phase 5 - AI Security Enhancements**: Implementing **advanced spam filtering, API rate limits, and automated AI behavior monitoring**.
6. **Phase 6 - AI Personalization & Dynamic Adaptation**: Deploying **user-specific chat profiles**, memory-based conversations, and **adaptive responses based on past interactions**.

---
## 📂 **Project Structure & Core Components**

### 🔹 **Backend (API, Database & Server-Side AI Processing)**
| File                                 | Purpose                                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------------------|
| `api/server.js`                      | Manages **chatbot interactions, airdrop verification requests, API endpoints, and middleware processing**. |
| `api/logQuestion.js`                 | Logs user queries to **track AI performance, refine response accuracy, and identify gaps in the knowledge base**. |
| `api/externalTokenListingUpdate.js`  | Fetches **real-time token listing data from external sources** to enhance airdrop analysis. |
| `api/dymensionAPI.js`                | API module for **Dymension RollApps** integration, enabling decentralized finance interactions. |
| `modules/nlp/transformer.js`         | AI-powered **text processor and response generator**, leveraging **GPT-3.5/4 for contextual responses**. |
| `modules/intent/intentRecognizer.js` | NLP-driven **intent recognition engine**, classifying complex queries and handling **multi-intent scenarios**. |
| `api/seedKnowledge.js`               | Initializes **MongoDB with predefined AI knowledge** for faster response generation. |
| `modules/security/rateLimiter.js`    | Implements **adaptive request rate limiting**, ensuring **protection against bot spam and API abuse**. |
| `modules/cache/memoryCache.js`       | **Caches frequently accessed chatbot responses**, significantly reducing API call overhead. |
| `modules/logging/errorHandler.js`    | Handles **structured API logging, AI query tracking, and dynamic error resolution**. |
| `modules/training/selfLearning.js`   | Facilitates **real-time AI self-learning mechanisms**, continuously **improving chatbot accuracy**. |
| `modules/conversation/contextHandler.js` | Stores **multi-turn conversational states**, allowing AI to **recall past interactions** for a personalized experience. |
| `modules/ai_personalization/userProfiles.js` | Manages **user profile memory**, adapting AI interactions based on **historical usage data**. |

### 🔹 **Testing, Deployment & Automation**
| File                              | Purpose                                                                                  |
|-----------------------------------|------------------------------------------------------------------------------------------|
| `tests/test.js`                   | API validation and **unit testing for key chatbot & API interactions**. |
| `tests/test_transformer.js`        | **Ensures correctness** of AI-powered **text transformation and NLP pipelines**. |
| `script/update_csv_github.py`      | Automates **CSV updates for airdrop eligibility**, syncing data with **GitHub Actions workflows**. |
| `script/update_noneligible.py`     | Manages **wallet blacklist updates**, preventing fraud in airdrop distribution. |
| `script/unified_update.py`         | **Centralized automation script**, handling **multiple scheduled tasks and repository sync**. |

---
## 💪 **Roadmap & Future Enhancements**
- **🤖 AI Knowledge Graph Expansion**: Automating **data extraction, pattern recognition, and self-improving chatbot logic**.
- **🌍 Multilingual NLP Support**: Expanding chatbot functionality to **support multiple languages** for global reach.
- **🏃‍♂️ Performance Optimization**: Enhancing **query execution speeds, AI model efficiency, and response caching mechanisms**.
- **🔒 Enhanced Security Protocols**: Deploying **real-time fraud detection, anti-bot measures, and authentication security layers**.
- **🛠️ Improved API Monitoring**: Creating **intelligent debugging logs**, integrating **AI-driven diagnostics and automated issue resolution**.

🚀 **This document consolidates all essential system knowledge, ensuring efficient maintenance, AI enhancements, and developer collaboration.**

