#!/bin/bash

# 🚀 Auto-Update & Deploy Script for Netlify
LOGS_DIR="/tmp/logs"
LOG_FILE="$LOGS_DIR/auto_update.log"
NETLIFY_CMD="netlify"

# 📁 Assicuriamoci che la cartella di logging esista
mkdir -p "$LOGS_DIR"

echo "🔹 Starting Auto-Update Process..." | tee $LOG_FILE

# ✅ Ensure Required Tools Are Installed
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 not found! Install it with: $2" | tee -a $LOG_FILE
    exit 1
  fi
}

check_command "git" "sudo apt install git -y"
check_command "npm" "sudo apt install npm -y"
check_command "$NETLIFY_CMD" "npm install -g netlify-cli"

# ✅ Check if Repository is Clean
if [[ $(git status --porcelain) ]]; then
  echo "⚠️ Uncommitted changes detected! Please commit or stash them before proceeding." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Pull Latest Code
echo "🔹 Pulling latest changes from Git..." | tee -a $LOG_FILE
git pull origin main | tee -a $LOG_FILE
GIT_STATUS=$?

if [ $GIT_STATUS -ne 0 ]; then
  echo "❌ Git pull failed! Check your repository connection." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Check if any new changes exist
if git diff --quiet HEAD^ HEAD; then
  echo "⚠️ No new changes detected. Skipping update." | tee -a $LOG_FILE
  exit 0
fi

# ✅ Update Dependencies
echo "🔹 Updating dependencies..." | tee -a $LOG_FILE
npm install --silent | tee -a $LOG_FILE
if [ $? -ne 0 ]; then
  echo "❌ npm install failed! Check for dependency issues." | tee -a $LOG_FILE
  exit 1
fi

# ✅ Run Tests Before Deployment
echo "🔹 Running tests (Timeout: 30s)..." | tee -a $LOG_FILE
timeout 30 npm test | tee -a $LOG_FILE
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