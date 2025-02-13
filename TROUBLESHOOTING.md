# Troubleshooting Guide - Iframe Airdrop

## Overview
This troubleshooting guide provides solutions for common issues encountered while running the **Iframe Airdrop** backend system. It covers connectivity, NLP model handling, API errors, and performance issues, ensuring seamless operation for developers and future AI improvements.

---
## Common Issues & Fixes

### 1. **MongoDB Connection Error**
**Issue:**
- The API fails to connect to MongoDB.
- Requests return a `500 Internal Server Error` due to database inaccessibility.

**Fix:**
- Ensure `MONGO_URI` is correctly set in the `.env` file.
- Verify that MongoDB Atlas IP whitelisting includes the current server.
- Test the connection manually with:
  ```bash
  mongosh "MONGO_URI"
  ```
- If using a local MongoDB instance, ensure the service is running:
  ```bash
  systemctl status mongod
  ```

---
### 2. **NLP Model Not Loading**
**Issue:**
- The NLP model fails to initialize or loads an empty model.

**Fix:**
- Check if `loadNLPModel()` retrieves valid data from MongoDB.
- If no model exists, retrain using:
  ```javascript
  await trainAndSaveNLP();
  ```
- Ensure the model is saved correctly after training.

---
### 3. **Responses Returning `[object Object]`**
**Issue:**
- Answers from MongoDB appear as `[object Object]` instead of strings.
- JSON structure issues when retrieving stored responses.

**Fix:**
- Update all stored answers to ensure they are saved as strings:
  ```javascript
  db.questions.updateMany(
    { answer: { $type: "object" } },
    { $set: { answer: { $toString: "$answer.answer" } } }
  )
  ```
- Modify `server.js` to correctly handle object-to-string conversions:
  ```javascript
  res.json({ answer: typeof safeAnswer === "string" ? safeAnswer : JSON.stringify(safeAnswer), source: safeSource });
  ```

---
### 4. **CORS Policy Errors**
**Issue:**
- The frontend fails to make API requests due to CORS restrictions.
- Requests are blocked by `Access-Control-Allow-Origin` errors.

**Fix:**
- Ensure the correct domain is whitelisted in `cors` settings:
  ```javascript
  app.use(cors({
    origin: "https://helon.space",
    credentials: true
  }));
  ```
- Restart the server after changes:
  ```bash
  npm run dev
  ```

---
### 5. **Rate Limit Exceeded**
**Issue:**
- Users report being blocked after multiple API requests.
- API returns a `429 Too Many Requests` error.

**Fix:**
- Adjust the rate limiter settings in `server.js`:
  ```javascript
  app.use(rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 20
  }));
  ```
- If necessary, increase the limit for trusted users.

---
### 6. **Timeout Errors on API Calls**
**Issue:**
- Requests take too long to respond and result in timeouts.

**Fix:**
- Increase request timeout in `server.js`:
  ```javascript
  app.use(timeout('15s'));
  ```
- Optimize MongoDB queries with indexing:
  ```javascript
  db.questions.createIndex({ question: 1 });
  ```
- Use async processing where possible.

---
## Recent Fixes & Updates

### [2025-02-13]
- Fixed incorrect object storage in MongoDB.
- Enhanced response formatting to ensure string output.
- Improved logging to track API failures.

### [2025-02-12]
- Increased request timeout settings.
- Improved database indexing for better performance.
- Introduced stricter error handling for NLP processing.

### [2025-02-11]
- Added enhanced security policies to API endpoints.
- Implemented stricter type validation for requests.
- Improved logging mechanisms for better debugging.

---
## Reporting Issues
For unresolved issues, open a ticket on GitHub or contact support at `support@helon.space`.
