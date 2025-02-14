#!/bin/bash

# 🚀 Auto-Update & Deploy Script for Netlify
LOG_FILE="auto_update.log"
NETLIFY_CMD="netlify"

echo "🔹 Starting Auto-Update Process..." | tee $LOG_FILE

# ✅ Ensure Netlify CLI is Installed
if ! command -v $NETLIFY_CMD &> /dev/null; then
  echo "❌ Netlify CLI not found! Install it with: npm install -g netlify-cli" | tee -a $LOG_FILE
  exit 1
fi

# ✅ Pull Latest Code
echo "🔹 Pulling latest changes from Git..." | tee -a $LOG_FILE
git pull origin main | tee -a $LOG_FILE
if [ $? -ne 0 ]; then
  echo "❌ Git pull failed! Check your repository connection." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Update Dependencies
echo "🔹 Updating dependencies..." | tee -a $LOG_FILE
npm install | tee -a $LOG_FILE
if [ $? -ne 0 ]; then
  echo "❌ npm install failed! Check for dependency issues." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Run Tests Before Deployment
echo "🔹 Running tests..." | tee -a $LOG_FILE
npm test | tee -a $LOG_FILE
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting deployment." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Deploy to Netlify
echo "✅ Tests passed! Deploying to Netlify..." | tee -a $LOG_FILE
$NETLIFY_CMD deploy --prod | tee -a $LOG_FILE
if [ $? -ne 0 ]; then
  echo "❌ Netlify deployment failed! Check your credentials and Netlify site settings." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Log Completion
echo "✅ Auto-Update Process Completed Successfully!" | tee -a $LOG_FILE
exit 0