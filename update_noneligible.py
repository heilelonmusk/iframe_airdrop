import sys
import csv
import io
from datetime import datetime
import github3
import os

def update_non_eligible(new_wallet):
    # Configurazione
    GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
    GITHUB_REPO = "heilelonmusk/iframe_airdrop"
    BRANCH = "main"
    
    # Autenticazione con GitHub
    gh = github3.login(token=GITHUB_TOKEN)
    if gh is None:
        print("Authentication failed.")
        sys.exit(1)
    
    repo = gh.repository(*GITHUB_REPO.split("/"))
    if repo is None:
        print("Repository not found.")
        sys.exit(1)
    
    file_path = "data/non_eligible.csv"
    
    # Prova a leggere il file; se non esiste, inizia con l'intestazione
    try:
        file_content = repo.file_contents(file_path, ref=BRANCH)
        csv_data = file_content.decoded_content.decode("utf-8")
    except github3.exceptions.NotFoundError:
        csv_data = "Wallet Address,DateTime\n"
        file_content = None
    
    # Leggi i dati CSV in memoria e raccogli gli indirizzi già registrati
    reader = csv.DictReader(io.StringIO(csv_data))
    existing_wallets = set()
    for row in reader:
        if "Wallet Address" in row and row["Wallet Address"]:
            existing_wallets.add(row["Wallet Address"].strip().lower())
    
    if new_wallet.strip().lower() in existing_wallets:
        print(f"Wallet {new_wallet} is already recorded in non_eligible.csv.")
        return
    
    # Aggiungi una nuova riga con il wallet e il timestamp corrente
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_row = f"{new_wallet},{timestamp}\n"
    updated_csv = csv_data + new_row
    
    # Aggiorna il file su GitHub
    try:
        if file_content:
            repo.update_file(
                file_path,
                f"Update non_eligible.csv: add {new_wallet}",
                updated_csv.encode("utf-8"),
                file_content.sha,
                branch=BRANCH
            )
        else:
            repo.create_file(
                file_path,
                f"Create non_eligible.csv with {new_wallet}",
                updated_csv.encode("utf-8"),
                branch=BRANCH
            )
        print(f"Wallet {new_wallet} added to non_eligible.csv.")
    except Exception as e:
        print(f"Error updating non_eligible.csv: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet_address = sys.argv[1]
    update_non_eligible(wallet_address)
