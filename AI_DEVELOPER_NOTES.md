# AI Developer Notes

## Table of Contents
1. [Introduction](#introduction)
2. [Project Architecture](#project-architecture)
3. [API Endpoints & Functionality](#api-endpoints--functionality)
4. [MongoDB Data Schema](#mongodb-data-schema)
5. [GitHub & Netlify Integration](#github--netlify-integration)
6. [Security & Authentication](#security--authentication)
7. [Error Handling & Troubleshooting](#error-handling--troubleshooting)
8. [Future Enhancements](#future-enhancements)
9. [Related Documentation](#related-documentation)

---

## Introduction
This document serves as a technical reference for the development of the **Iframe Airdrop** project. It provides insights into the architecture, API design, database schema, and integration strategies used to enable a seamless, AI-powered verification system.

---

## Project Architecture
Iframe Airdrop is structured to allow AI-driven, serverless airdrop validation. The core functionalities include:
- **GitHub Integration**: Fetching and managing resources from a designated repository.
- **Netlify Hosting**: Handling static assets and backend functions.
- **MongoDB Storage**: Storing knowledge base information dynamically.
- **AI Chatbot (Ultron AI)**: Future implementation of an intelligent chatbot capable of real-time verification.

Refer to the **[README](README.md)** for an overall project overview and to **[TROUBLESHOOTING](TROUBLESHOOTING.md)** for issue tracking.

---

## API Endpoints & Functionality
### `/fetch`
- **Purpose**: Retrieves files or data from GitHub, Netlify, or MongoDB.
- **Parameters**:
  - `source` (github/netlify/mongodb)
  - `file` (required for GitHub & Netlify)
  - `query` (required for MongoDB)

### `/store`
- **Purpose**: Stores or updates key-value pairs in MongoDB.
- **Parameters**:
  - `key`: Unique identifier.
  - `value`: Data to be stored.

### `/download`
- **Purpose**: Downloads files from GitHub or Netlify.
- **Parameters**:
  - `source` (github/netlify)
  - `file` (file path)

---

## MongoDB Data Schema
Schema used for knowledge base storage:
```javascript
const KnowledgeSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
});
```

---

## GitHub & Netlify Integration
### GitHub
- Uses the GitHub API to fetch files using an authenticated request.
- Requires `GITHUB_OWNER`, `GITHUB_REPO`, and `MY_GITHUB_TOKEN` environment variables.

### Netlify
- Serves static files and redirects API requests.
- Requires `NETLIFY_URL` environment variable.

---

## Security & Authentication
- **GitHub API Requests**: Uses personal access tokens.
- **MongoDB Connection**: Secure connection using `MONGO_URI`.
- **Rate Limiting & Data Validation**: Planned enhancements.

---

## Error Handling & Troubleshooting
- **404 Errors (GitHub Fetch)**: Ensure correct file paths and repository access.
- **MongoDB Timeout Issues**: Verify database connection and schema integrity.
- **Netlify Redirection Failures**: Ensure `NETLIFY_URL` is correctly set.

More issues and fixes can be found in the **[TROUBLESHOOTING](TROUBLESHOOTING.md)** document.

---

## Future Enhancements
- **Ultron AI Chatbot**: AI-powered chat verification.
- **Enhanced Rate Limiting & Security**.
- **Extended Netlify API Functionalities**.

---

## Related Documentation
- 📄 **[README](README.md)** - General project overview and index.
- 🛠 **[TROUBLESHOOTING](TROUBLESHOOTING.md)** - Detailed issue tracking.
- 🌐 **[GitHub Repo](https://github.com/heilelonmusk/iframe_airdrop)** - Source code repository.