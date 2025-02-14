# TROUBLESHOOTING GUIDE

## Table of Contents
1. [Introduction](#introduction)
2. [General Debugging Workflow](#general-debugging-workflow)
3. [Common Issues & Fixes](#common-issues--fixes)
   - [GitHub API Errors](#github-api-errors)
   - [MongoDB Connection Issues](#mongodb-connection-issues)
   - [Netlify Redirection Problems](#netlify-redirection-problems)
   - [Serverless Deployment Issues](#serverless-deployment-issues)
   - [CORS Issues](#cors-issues)
   - [Authorization & Environment Variables](#authorization--environment-variables)
4. [Development Timeline & Debugging History](#development-timeline--debugging-history)
5. [References & Additional Documentation](#references--additional-documentation)

---

## Introduction

This troubleshooting document serves as a **comprehensive guide** to resolving issues encountered during the development of the **Iframe Airdrop Verification System**. It references other documentation, including:
- **[README.md](README.md)** for a project overview.
- **[AI_DEVELOPER_NOTES.md](AI_DEVELOPER_NOTES.md)** for technical implementation details.

For each issue, we provide a **description, possible causes, and step-by-step solutions**.

---

## General Debugging Workflow

1. **Reproduce the Issue** – Identify when and where the problem occurs.
2. **Check Console & Logs** – Use `console.log`, `Netlify function logs`, and `MongoDB Atlas logs`.
3. **Validate API Calls** – Use `curl` or Postman to test API endpoints.
4. **Review Environment Variables** – Ensure `.env` is correctly set up.
5. **Use Debugging Tools** – Utilize Chrome DevTools, Postman, and MongoDB Compass.

---

## Common Issues & Fixes

### GitHub API Errors

#### ❌ Problem: 404 Not Found when fetching a GitHub file
- **Cause:** Incorrect file path, missing repository access, or invalid GitHub token.
- **Solution:**
  - Verify the file path using `https://api.github.com/repos/{OWNER}/{REPO}/contents/{FILE}`.
  - Ensure the GitHub token has `repo` scope permissions.
  - Check if the file exists in the `main` branch.
  
### MongoDB Connection Issues

#### ❌ Problem: Timeout error when fetching data
- **Cause:** Incorrect MongoDB URI or network restrictions.
- **Solution:**
  - Confirm MongoDB Atlas IP Whitelist allows your server.
  - Verify `MONGO_URI` is correctly set in `.env`.
  - Restart the database connection.

### Netlify Redirection Problems

#### ❌ Problem: "Found. Redirecting to undefined/example.json"
- **Cause:** `NETLIFY_URL` is missing in `.env`.
- **Solution:**
  - Ensure `NETLIFY_URL=https://your-netlify-site.netlify.app` is correctly set.
  - Restart the serverless function.

### Serverless Deployment Issues

#### ❌ Problem: Functions failing on Netlify
- **Cause:** Missing dependencies, syntax errors, or Netlify misconfiguration.
- **Solution:**
  - Run `netlify dev` locally to test.
  - Check `package.json` for missing dependencies.
  - Update Netlify function settings.

### CORS Issues

#### ❌ Problem: "CORS policy blocked request"
- **Cause:** Server is not allowing cross-origin requests.
- **Solution:**
  - Ensure `cors` is enabled in Express: `app.use(cors());`
  - Add the `Access-Control-Allow-Origin` header.

### Authorization & Environment Variables

#### ❌ Problem: "Unauthorized" error when calling APIs
- **Cause:** Missing or invalid API keys.
- **Solution:**
  - Verify `MY_GITHUB_TOKEN` is included in API calls.
  - Ensure `.env` variables are loaded correctly with `require('dotenv').config();`

---

## Development Timeline & Debugging History

### **Initial Development (Phase 1)**
- Implemented GitHub file fetching (worked via API but caused 404 errors due to incorrect file paths).
- Resolved MongoDB schema conflicts.
- Introduced initial Netlify function routing.

### **Expansion & Refinement (Phase 2)**
- Improved error handling in `fetch`, `store`, and `download` endpoints.
- Added base64 decoding for GitHub file retrieval.
- Fixed Netlify redirect issue by properly handling URLs.

### **Optimization & AI Integration (Phase 3)**
- Introduced AI knowledge base via MongoDB.
- Expanded CORS policy for broader API integrations.
- Finalized `iframe` logic and chat-based AI validation for airdrops.

---

## References & Additional Documentation

- **[GitHub API Documentation](https://docs.github.com/en/rest/repos/contents#get-repository-content)**
- **[MongoDB Atlas Troubleshooting Guide](https://www.mongodb.com/docs/atlas/troubleshoot/)**
- **[Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)**

