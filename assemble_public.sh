#!/bin/bash
# Script: assemble_public.sh
# Scopo: Creare una cartella "public" e raccogliere al suo interno i file statici da deployare su GitHub Pages

# Rimuovi eventuali versioni precedenti della cartella "public"
rm -rf public
mkdir public

# 1. Copia il file HTML dell'AirDrop Checker dalla cartella "iframe"
if [ -f "iframe/airdrop_checker.html" ]; then
  cp iframe/airdrop_checker.html public/
  echo "Copied iframe/airdrop_checker.html to public/"
else
  echo "Error: iframe/airdrop_checker.html not found."
fi

# 2. Copia lo script JavaScript per l'AirDrop Checker dalla cartella "iframe"
if [ -f "iframe/airdrop_checker.js" ]; then
  cp iframe/airdrop_checker.js public/
  echo "Copied iframe/airdrop_checker.js to public/"
else
  echo "Error: iframe/airdrop_checker.js not found."
fi

# 3. Copia le immagini necessarie dalla cartella "data/img"
if [ -d "data/img" ]; then
  mkdir -p public/img
  cp -r data/img/* public/img/
  echo "Copied images from data/img to public/img/"
else
  echo "Warning: data/img folder not found."
fi

# 4. (Opzionale) Copia il file della chat Ultron se desiderato nel sito pubblico
if [ -f "ultron_chat/ultronChat.js" ]; then
  mkdir -p public/ultron_chat
  cp ultron_chat/ultronChat.js public/ultron_chat/
  echo "Copied ultron_chat/ultronChat.js to public/ultron_chat/"
else
  echo "Warning: ultron_chat/ultronChat.js not found."
fi

echo "Public folder assembled successfully. Contents:"
ls -la public
