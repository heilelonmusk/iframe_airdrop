#!/bin/bash

# 🚀 Netlify Function API Test Script
# Runs API checks on a deployed Netlify function

NETLIFY_URL="https://your-netlify-app.netlify.app/.netlify/functions/unifiedAccess"
LOG_FILE="netlify_test.log"

echo "🛠 Starting Netlify API Tests..." | tee $LOG_FILE

# ✅ Test API Health Check
echo "🔹 Checking API Health..." | tee -a $LOG_FILE
curl -s -o /dev/null -w "%{http_code}" "$NETLIFY_URL/health" | tee -a $LOG_FILE

# ✅ Test Fetch from GitHub
echo "🔹 Testing GitHub Fetch..." | tee -a $LOG_FILE
curl -s -X GET "$NETLIFY_URL/fetch?source=github&file=README.md" | tee -a $LOG_FILE

# ✅ Test MongoDB Fetch
echo "🔹 Testing MongoDB Fetch..." | tee -a $LOG_FILE
curl -s -X GET "$NETLIFY_URL/fetch?source=mongodb&query=test_key" | tee -a $LOG_FILE

# ✅ Test Store in MongoDB
echo "🔹 Testing MongoDB Storage..." | tee -a $LOG_FILE
curl -s -X POST "$NETLIFY_URL/store" -H "Content-Type: application/json" -d '{"key": "test_key", "value": "Hello MongoDB!"}' | tee -a $LOG_FILE

# ✅ Test File Download from GitHub
echo "🔹 Testing GitHub File Download..." | tee -a $LOG_FILE
curl -s -o /dev/null -w "%{http_code}" "$NETLIFY_URL/download?source=github&file=README.md" | tee -a $LOG_FILE

# ✅ Test Non-Existing File Download (Should return 404)
echo "🔹 Testing Non-Existing File on Netlify..." | tee -a $LOG_FILE
curl -s -o /dev/null -w "%{http_code}" "$NETLIFY_URL/download?source=netlify&file=nonexistent.json" | tee -a $LOG_FILE

# ✅ Log Completion
echo "✅ Netlify API Tests Completed!" | tee -a $LOG_FILE