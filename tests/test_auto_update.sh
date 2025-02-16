#!/bin/bash

# 🚀 Auto-Update & Deploy Script for Netlify
LOGS_DIR="/tmp/logs"
LOG_FILE="$LOGS_DIR/auto_update.log"
NETLIFY_CMD="netlify"
TIMEOUT_DURATION=60  # Tempo massimo per l'esecuzione dei test (in secondi)

# 📁 Assicuriamoci che la cartella dei log esista
mkdir -p "$LOGS_DIR"

echo "🔹 Starting Auto-Update Process..." | tee "$LOG_FILE"

# ✅ Funzione per controllare se un comando esiste
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 non trovato! Installa con: $2" | tee -a "$LOG_FILE"
    exit 1
  fi
}

check_command "git" "sudo apt install git -y"
check_command "npm" "sudo apt install npm -y"
check_command "$NETLIFY_CMD" "npm install -g netlify-cli"

# ✅ Verifica connessione a GitHub
echo "🔹 Verificando connessione a GitHub..." | tee -a "$LOG_FILE"
if ! git ls-remote origin &> /dev/null; then
  echo "❌ Errore: Connessione a GitHub non riuscita. Verifica le credenziali o la connessione di rete." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Controllo se ci sono modifiche non committate
if [[ $(git status --porcelain) ]]; then
  echo "⚠️ Modifiche non committate rilevate! Effettua il commit o uno stash prima di aggiornare." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Pull dell'ultima versione del codice
echo "🔹 Scaricando gli ultimi aggiornamenti da GitHub..." | tee -a "$LOG_FILE"
git pull origin main | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
  echo "❌ Errore durante il pull da GitHub. Verifica il repository." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Verifica se ci sono cambiamenti effettivi
if git diff --quiet HEAD^ HEAD; then
  echo "⚠️ Nessun aggiornamento rilevato. Chiusura dello script." | tee -a "$LOG_FILE"
  exit 0
fi

# ✅ Aggiornamento delle dipendenze
echo "🔹 Aggiornando le dipendenze..." | tee -a "$LOG_FILE"
npm install --silent | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
  echo "❌ Errore durante l'installazione delle dipendenze. Verifica i pacchetti." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Esecuzione dei test
echo "🔹 Avvio dei test (Timeout: ${TIMEOUT_DURATION}s)..." | tee -a "$LOG_FILE"
timeout "$TIMEOUT_DURATION" npm test | tee -a "$LOG_FILE"
TEST_RESULT=$?

if [ "$TEST_RESULT" -eq 124 ]; then
  echo "❌ Test timeout! Test interrotti dopo ${TIMEOUT_DURATION} secondi." | tee -a "$LOG_FILE"
  exit 1
elif [ "$TEST_RESULT" -ne 0 ]; then
  echo "❌ Test falliti! Annullamento del deploy." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Deploy su Netlify
echo "✅ Test superati! Avvio deploy su Netlify..." | tee -a "$LOG_FILE"
"$NETLIFY_CMD" deploy --prod | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
  echo "❌ Errore durante il deploy su Netlify! Controlla credenziali e impostazioni." | tee -a "$LOG_FILE"
  exit 1
fi

# ✅ Log finale
echo "✅ Processo di aggiornamento e deploy completato con successo!" | tee -a "$LOG_FILE"
exit 0