#!/bin/bash

# 🚀 Auto-Update & Deploy Script for Netlify
LOG_FILE="auto_update.log"

echo "🔹 Starting Auto-Update Process..." | tee $LOG_FILE

# ✅ Pull Latest Code
echo "🔹 Pulling latest changes from Git..." | tee -a $LOG_FILE
git pull origin main | tee -a $LOG_FILE

# ✅ Update Dependencies
echo "🔹 Updating dependencies..." | tee -a $LOG_FILE
npm install | tee -a $LOG_FILE

# ✅ Run Tests Before Deployment
echo "🔹 Running tests..." | tee -a $LOG_FILE
npm test | tee -a $LOG_FILE

# ✅ If Tests Pass, Deploy to Netlify
if [ $? -eq 0 ]; then
  echo "✅ Tests passed! Deploying to Netlify..." | tee -a $LOG_FILE
  netlify deploy --prod | tee -a $LOG_FILE
else
  echo "❌ Tests failed! Aborting deployment." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Log Completion
echo "✅ Auto-Update Process Completed!" | tee -a $LOG_FILE