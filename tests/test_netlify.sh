#!/bin/bash

# 🚀 Netlify Function API Test Script
# Runs API checks on a deployed Netlify function

NETLIFY_URL="https://your-netlify-app.netlify.app/.netlify/functions/unifiedAccess"
LOG_FILE="netlify_test.log"

echo "🛠 Starting Netlify API Tests..." | tee $LOG_FILE

# ✅ Function to handle API requests and log errors
api_test() {
  local description=$1
  local url=$2
  local method=${3:-GET}
  local data=$4
  local response

  echo "🔹 $description..." | tee -a $LOG_FILE

  if [[ "$method" == "POST" ]]; then
    response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}")
  else
    response=$(curl -s -X GET "$url" -w "\n%{http_code}")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "✅ Success ($http_code): $body" | tee -a $LOG_FILE
  else
    echo "❌ Failed ($http_code): $body" | tee -a $LOG_FILE
    exit 1
  fi
}

# ✅ Test API Health Check
api_test "Checking API Health" "$NETLIFY_URL/health"

# ✅ Test Fetch from GitHub
api_test "Testing GitHub Fetch" "$NETLIFY_URL/fetch?source=github&file=README.md"

# ✅ Test MongoDB Fetch
api_test "Testing MongoDB Fetch" "$NETLIFY_URL/fetch?source=mongodb&query=test_key"

# ✅ Test Store in MongoDB
api_test "Testing MongoDB Storage" "$NETLIFY_URL/store" "POST" '{"key": "test_key", "value": "Hello MongoDB!"}'

# ✅ Test File Download from GitHub
api_test "Testing GitHub File Download" "$NETLIFY_URL/download?source=github&file=README.md"

# ✅ Test Non-Existing File Download (Should return 404)
api_test "Testing Non-Existing File on Netlify" "$NETLIFY_URL/download?source=netlify&file=nonexistent.json"

# ✅ Log Completion
echo "✅ Netlify API Tests Completed Successfully!" | tee -a $LOG_FILE
exit 0