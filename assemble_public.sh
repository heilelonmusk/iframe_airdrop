#!/bin/bash
# Rimuove eventuali versioni precedenti della cartella "public" e ne crea una nuova
rm -rf public
mkdir public

# Copia il file HTML principale dall'interno della cartella "iframe"
if [ -f "iframe/airdrop_checker.html" ]; then
  cp iframe/airdrop_checker.html public/
  echo "Copied iframe/airdrop_checker.html to public/"
else
  echo "Error: iframe/airdrop_checker.html not found."
fi

# Copia lo script per l'AirDrop Checker
if [ -f "iframe/airdrop_checker.js" ]; then
  cp iframe/airdrop_checker.js public/
  echo "Copied iframe/airdrop_checker.js to public/"
else
  echo "Error: iframe/airdrop_checker.js not found."
fi

# Copia le immagini necessarie (se presenti)
if [ -d "data/img" ]; then
  mkdir -p public/img
  cp -r data/img/* public/img/
  echo "Copied images from data/img to public/img/"
fi

# (Opzionale) Copia il file della chat Ultron se desiderato
if [ -f "ultron_chat/ultronChat.js" ]; then
  mkdir -p public/ultron_chat
  cp ultron_chat/ultronChat.js public/ultron_chat/
  echo "Copied ultron_chat/ultronChat.js to public/ultron_chat/"
fi

echo "Public folder assembled successfully:"
ls -la public
