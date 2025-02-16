#!/bin/bash

# 🚀 Netlify Function API Test Script
# Runs API checks on a deployed Netlify function (Unified Access)

# 🌍 Configurazione
NETLIFY_URL="https://superlative-empanada-0c1b37.netlify.app/.netlify/functions/unifiedAccess"
LOG_DIR="/tmp/logs"
LOG_FILE="$LOG_DIR/netlify_test.log"

# 📁 Assicuriamoci che la cartella dei log esista
mkdir -p "$LOG_DIR"

echo "🛠 Starting Netlify API Tests..." | tee "$LOG_FILE"

# ✅ Funzione per verificare che un comando esista
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ Command '$1' not found! Install it with: $2" | tee -a "$LOG_FILE"
    exit 1
  fi
}

# ✅ Verifica strumenti necessari
check_command "curl" "sudo apt install curl -y"
check_command "redis-cli" "sudo apt install redis-tools -y"

# ✅ Verifica che l'endpoint Netlify sia raggiungibile
if ! curl -s --head --request GET "$NETLIFY_URL/health" | grep "200 OK" > /dev/null; then
  echo "❌ Netlify API endpoint is unreachable! Aborting tests." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Funzione per gestire le richieste API e loggare eventuali errori
api_test() {
  local description=$1
  local url=$2
  local method=${3:-GET}
  local data=$4
  local response
  local http_code
  local body

  echo "🔹 $description..." | tee -a "$LOG_FILE"

  if [[ "$method" == "POST" ]]; then
    response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data" --max-time 10 -w "\n%{http_code}")
  else
    response=$(curl -s -X GET "$url" --max-time 10 -w "\n%{http_code}")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "✅ Success ($http_code): $body" | tee -a "$LOG_FILE"
  else
    echo "❌ Failed ($http_code): $body" | tee -a "$LOG_FILE"
  fi
}

# ✅ Test API Health Check
api_test "Checking API Health" "$NETLIFY_URL/health"

# ✅ Test Fetch from GitHub
api_test "Testing GitHub Fetch" "$NETLIFY_URL/fetch?source=github&file=README.md"

# ✅ Test MongoDB Fetch
api_test "Testing MongoDB Fetch" "$NETLIFY_URL/fetch?source=mongodb&query=test_key"

# ✅ Test Invalid Source Parameter (should return error)
api_test "Testing Invalid Source Parameter" "$NETLIFY_URL/fetch?source=invalid"

# ✅ Test Redis Connectivity using REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD
echo "🔹 Checking Redis Connection..." | tee -a "$LOG_FILE"
redis_response=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" PING 2>/dev/null)
if [[ "$redis_response" == "PONG" ]]; then
  echo "✅ Redis is connected!" | tee -a "$LOG_FILE"
else
  echo "⚠️ Redis connection failed or unavailable!" | tee -a "$LOG_FILE"
fi

# ✅ Log Completion
echo "✅ Netlify API Tests Completed Successfully!" | tee -a "$LOG_FILE"
exit 0