#!/bin/bash

# Set API Base URL (Replace with your actual Netlify domain)
NETLIFY_API="https://superlative-empanada-0c1b37.netlify.app/api"

echo "🚀 Running Netlify API Tests..."

# ✅ 1. Test Fetching a File from GitHub
echo "📌 Testing /api/fetch (GitHub)..."
curl -X GET "$NETLIFY_API/fetch?source=github&file=README.md" \
     -H "Authorization: token $MY_GITHUB_TOKEN" -w "\n"

# ✅ 2. Test Fetching a File from Netlify
echo "📌 Testing /api/fetch (Netlify)..."
curl -X GET "$NETLIFY_API/fetch?source=netlify&file=README.md" -w "\n"

# ✅ 3. Test Fetching a Record from MongoDB
echo "📌 Testing /api/fetch (MongoDB)..."
curl -X GET "$NETLIFY_API/fetch?source=mongodb&query=test_key" -w "\n"

# ✅ 4. Test Storing Data into MongoDB
echo "📌 Testing /api/store..."
curl -X POST "$NETLIFY_API/store" \
     -H "Content-Type: application/json" \
     -d '{"key": "test_key", "value": "Hello, Netlify!"}' -w "\n"

# ✅ 5. Test Downloading a File from GitHub
echo "📌 Testing /api/download (GitHub)..."
curl -X GET "$NETLIFY_API/download?source=github&file=README.md" -w "\n"

# ✅ 6. Test Downloading a File from Netlify
echo "📌 Testing /api/download (Netlify)..."
curl -X GET "$NETLIFY_API/download?source=netlify&file=README.md" -w "\n"

echo "✅ All Netlify API Tests Completed!"