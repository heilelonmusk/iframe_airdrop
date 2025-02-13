# 🧐 Troubleshooting & Debugging Guide

## 📌 Overview
This document provides **common issues** and **solutions** encountered when developing and deploying the **iframe_airdrop & Ultron AI Chat System**.

---
## ⚠️ **Common Errors & Fixes**

### 🚨 **1. API CORS Issues**
#### ❌ Problem:
- **Frontend requests blocked** due to CORS policy.
- Error message: `Access-Control-Allow-Origin blocked`.

#### ✅ Solution:
- Modify `netlify.toml` to allow cross-origin requests:
```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```
- Ensure Express API sets appropriate headers:
```javascript
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
```

---

### 🚨 **2. MongoDB Connection Issues**
#### ❌ Problem:
- Cannot connect to **MongoDB Atlas**.
- Error: `MongooseServerSelectionError: Could not connect to primary node`.

#### ✅ Solution:
- Ensure `.env` file contains the correct **MongoDB URI**:
```env
MONGO_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/dbname
```
- **Whitelist IPs** in MongoDB Atlas settings.
- Restart the application after modifying `.env`:
```bash
npm run dev
```

---

### 🚨 **3. Netlify Serverless Function Errors (502/504 Bad Gateway)**
#### ❌ Problem:
- API returns `502 Bad Gateway`.
- **Netlify functions fail to execute properly**.

#### ✅ Solution:
- Ensure `server.js` is wrapped correctly using `serverless-http`:
```javascript
const serverless = require("serverless-http");
module.exports.handler = serverless(app);
```
- Check logs with:
```bash
netlify functions:invoke server
```

---

### 🚨 **4. WebSocket Connection Issues**
#### ❌ Problem:
- WebSocket closes immediately after connecting.
- Console error: `WebSocket connection closed unexpectedly`.

#### ✅ Solution:
- Ensure proper WebSocket initialization in **frontend and backend**:
```javascript
const socket = new WebSocket("wss://your-api-url.com/socket");
socket.onopen = () => console.log("Connected");
socket.onerror = (error) => console.error("WebSocket Error", error);
```
- Implement **auto-reconnect** for better stability.

---

### 🚨 **5. Chatbot Response Delays**
#### ❌ Problem:
- **Slow response times** when querying Ultron AI.
- Users experience **laggy interactions**.

#### ✅ Solution:
- **Optimize MongoDB queries** by indexing relevant fields:
```javascript
db.collection("messages").createIndex({ query: 1 });
```
- Enable **API response caching** to reduce redundant calls.

---
## 🎯 **How to Debug Issues Faster**
### 📝 **1. Enable Debug Logging**
Modify `.env`:
```env
DEBUG_MODE=true
```
Modify `server.js`:
```javascript
if (process.env.DEBUG_MODE === "true") {
    app.use(morgan("dev"));
}
```

### 🛠 **2. Check Netlify Logs**
```bash
netlify logs --functions
```

### 🔍 **3. Use Postman for API Testing**
- Send `GET` and `POST` requests to debug API endpoints.
- Verify JSON responses for correctness.

---
## 🔮 **Future Enhancements for Stability**
✅ **Auto-healing mechanisms** for WebSocket disconnections.  
✅ **AI-based monitoring** to detect errors in real-time.  
✅ **Rate limiting** to prevent API abuse.

---
This document will be **continuously updated** to improve debugging efficiency! 🚀

