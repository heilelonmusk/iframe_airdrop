#!/usr/bin/env python3
import requests
import json
import os
import sys

def main():
    # Recupera il token dalle variabili d'ambiente
    token = os.getenv("MY_GITHUB_TOKEN")
    if not token:
        print("MY_GITHUB_TOKEN is not set!")
        sys.exit(1)
    
    # Verifica che sia stato passato un wallet come parametro
    if len(sys.argv) < 2:
        print("Usage: python trigger_dispatch.py <wallet_address>")
        sys.exit(1)
    
    wallet_address = sys.argv[1]
    
    # Imposta i parametri per il repository e l'evento dispatch
    repo_owner = "heilelonmusk"
    repo_name = "iframe_airdrop"
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/dispatches"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    }
    
    # Prepara il payload dell'evento
    data = {
        "event_type": "update_whitelist",
        "client_payload": {
            "wallet": wallet_address
        }
    }
    
    # Effettua la richiesta POST per inviare l'evento
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code in [200, 204]:
        print("Event dispatched successfully.")
        sys.exit(0)
    else:
        print(f"Error dispatching event: {response.status_code}")
        print(response.text)
        sys.exit(1)

if __name__ == "__main__":
    main()
