#!/bin/bash
# scripts/assemble_public.sh

rm -rf public
mkdir public

# Copia il file HTML principale dall'iframe
if [ -f "iframe/airdrop_checker.html" ]; then
  cp iframe/airdrop_checker.html public/
  echo "Copied iframe/airdrop_checker.html to public/"
else
  echo "Error: iframe/airdrop_checker.html not found."
fi

# Copia lo script JS per l'AirDrop Checker
if [ -f "iframe/airdrop_checker.js" ]; then
  cp iframe/airdrop_checker.js public/
  echo "Copied iframe/airdrop_checker.js to public/"
else
  echo "Error: iframe/airdrop_checker.js not found."
fi

# Copia le immagini dalla cartella data/img
if [ -d "data/img" ]; then
  mkdir -p public/img
  cp -r data/img/* public/img/
  echo "Copied images from data/img to public/img/"
else
  echo "Warning: data/img folder not found."
fi

# Copia lo script della chat Ultron
if [ -f "ultron_chat/ultronChat.js" ]; then
  mkdir -p public/ultron_chat
  cp ultron_chat/ultronChat.js public/ultron_chat/
  echo "Copied ultron_chat/ultronChat.js to public/ultron_chat/"
else
  echo "Warning: ultron_chat/ultronChat.js not found."
fi

echo "Public folder assembled successfully. Contents:"
ls -la public
