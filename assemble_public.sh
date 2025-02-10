#!/bin/bash
# assemble_public.sh
# Questo script crea una cartella "public" nella root del repository e vi copia al suo interno i file statici necessari,
# partendo dalla struttura attuale del repository "iframe_airdrop".
#
# La struttura attuale (senza modifiche) è simile a:
# 
# iframe_airdrop/
# ├── data/
# │   ├── whitelist.csv
# │   ├── non_eligible.csv
# │   ├── iframe_settings.csv
# │   ├── knowledge.json
# │   └── img/
# │       └── img_ultronai.png
# ├── iframe/
# │   ├── airdrop_checker.html
# │   └── airdrop_checker.js
# ├── netlify/
# │   └── functions/
# │       └── triggerWhitelistUpdate.js
# ├── scripts/
# │   ├── trigger_dispatch.py
# │   ├── unified_update.py
# │   ├── update_csv_github.py
# │   ├── update_whitelist.py
# │   └── update_noneligible.py
# ├── ultron_chat/
# │   └── ultronChat.js
# ├── README.md
#
# L'obiettivo è creare una cartella "public" che contenga i file statici da pubblicare su GitHub Pages,
# ad esempio:
# - airdrop_checker.html e airdrop_checker.js (da "iframe/")
# - eventuali file CSS (se presenti) e immagini (da "data/img")
# - (Opzionale) ultronChat.js se desiderato nel deploy
#
# Lo script crea la cartella "public", la pulisce se esiste già, e copia i file dalle rispettive cartelle.

# Rimuove la cartella "public" se esiste già e ne crea una nuova
rm -rf public
mkdir public

# Copia il file HTML principale dell'AirDrop Checker dalla cartella "iframe"
if [ -f "iframe/airdrop_checker.html" ]; then
  cp iframe/airdrop_checker.html public/
  echo "Copied iframe/airdrop_checker.html to public/"
else
  echo "Error: iframe/airdrop_checker.html not found."
fi

# Copia lo script JavaScript per l'AirDrop Checker dalla cartella "iframe"
if [ -f "iframe/airdrop_checker.js" ]; then
  cp iframe/airdrop_checker.js public/
  echo "Copied iframe/airdrop_checker.js to public/"
else
  echo "Error: iframe/airdrop_checker.js not found."
fi

# Copia le immagini dalla cartella "data/img"
if [ -d "data/img" ]; then
  mkdir -p public/img
  cp -r data/img/* public/img/
  echo "Copied images from data/img to public/img/"
else
  echo "Warning: data/img folder not found."
fi

# Copia (opzionale) lo script della chat Ultron dalla cartella "ultron_chat"
if [ -f "ultron_chat/ultronChat.js" ]; then
  mkdir -p public/ultron_chat
  cp ultron_chat/ultronChat.js public/ultron_chat/
  echo "Copied ultron_chat/ultronChat.js to public/ultron_chat/"
else
  echo "Warning: ultron_chat/ultronChat.js not found."
fi

echo "Public folder assembled successfully. Contents:"
ls -la public
