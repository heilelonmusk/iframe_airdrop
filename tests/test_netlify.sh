#!/bin/bash

# Load environment variables
NETLIFY_API="https://superlative-empanada-0c1b37.netlify.app/api"  # Update this if needed
GITHUB_FILE="README.md"  # Change to any file in your repo
NETLIFY_FILE="index.html"  # Change to an actual file in Netlify
MONGO_KEY="test_key"
MONGO_VALUE="This is a test value"

echo "🚀 Running Netlify API Tests..."

# Test 1: Fetch a file from GitHub
echo "🔹 Test 1: Fetching file from GitHub..."
curl -X GET "$NETLIFY_API/fetch?source=github&file=$GITHUB_FILE"

# Test 2: Fetch a file from Netlify
echo -e "\n🔹 Test 2: Fetching file from Netlify..."
curl -X GET "$NETLIFY_API/fetch?source=netlify&file=$NETLIFY_FILE"

# Test 3: Fetch a record from MongoDB
echo -e "\n🔹 Test 3: Fetching data from MongoDB..."
curl -X GET "$NETLIFY_API/fetch?source=mongodb&query=$MONGO_KEY"

# Test 4: Store a new record in MongoDB
echo -e "\n🔹 Test 4: Storing data in MongoDB..."
curl -X POST "$NETLIFY_API/store" -H "Content-Type: application/json" -d '{
  "key": "'"$MONGO_KEY"'",
  "value": "'"$MONGO_VALUE"'"
}'

# Test 5: Download a file from GitHub
echo -e "\n🔹 Test 5: Downloading file from GitHub..."
curl -X GET "$NETLIFY_API/download?source=github&file=$GITHUB_FILE" -o "downloaded_github_$GITHUB_FILE"

# Test 6: Download a file from Netlify
echo -e "\n🔹 Test 6: Downloading file from Netlify..."
curl -X GET "$NETLIFY_API/download?source=netlify&file=$NETLIFY_FILE" -o "downloaded_netlify_$NETLIFY_FILE"

echo -e "\n✅ Tests Completed!"