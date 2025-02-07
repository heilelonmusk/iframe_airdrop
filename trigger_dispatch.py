import requests
import json
import os

# Recupera il token dalle variabili d'ambiente (assicurati di averlo impostato)
token = os.getenv("MY_GITHUB_TOKEN")
if not token:
    print("MY_GITHUB_TOKEN is not set!")
    exit(1)

# Imposta i parametri per il repository e l'evento
repo_owner = "heilelonmusk"
repo_name = "iframe_airdrop"
url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/dispatches"

headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {token}",
    "Content-Type": "application/json"
}

# Sostituisci l'indirizzo wallet con quello che vuoi inviare
data = {
    "event_type": "update_whitelist",
    "client_payload": {
        "wallet": "0x123abc..."  # Modifica questo valore con l'indirizzo wallet da aggiornare
    }
}

response = requests.post(url, headers=headers, data=json.dumps(data))

if response.status_code in [200, 204]:
    print("Event dispatched successfully.")
else:
    print(f"Error dispatching event: {response.status_code}")
    print(response.text)
