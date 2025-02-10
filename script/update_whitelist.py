import sys
import csv
import io
from datetime import datetime
import github3
import os

def update_whitelist(wallet_address):
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
    
    file_path = "data/whitelist.csv"
    
    try:
        # Leggi il contenuto attuale del file whitelist.csv
        file_content = repo.file_contents(file_path, ref=BRANCH)
        csv_data = file_content.decoded.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("Whitelist file not found.")
        sys.exit(1)
    
    # Leggi i dati CSV in memoria
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    updated = False
    for row in rows:
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            row["Checked"] = "true"
            row["DateTime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            updated = True
            break

    if not updated:
        print(f"Wallet address {wallet_address} not found in whitelist.")
        sys.exit(1)
    
    # Scrivi i dati aggiornati in una stringa CSV e codificala in bytes
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    # Prova a usare update_file; in caso di errore, usa un fallback che elimina e ricrea il file
    try:
        repo.update_file(
            file_path,
            f"Update whitelist for wallet {wallet_address}",
            new_csv,
            file_content.sha,
            branch=BRANCH
        )
        print(f"Whitelist updated for wallet {wallet_address}.")
    except Exception as e:
        print(f"Error updating whitelist using update_file: {e}")
        print("Attempting fallback: delete and recreate the file...")
        try:
            file_content.delete(f"Delete whitelist file for update (wallet {wallet_address})", branch=BRANCH)
        except Exception as delete_err:
            print(f"Error deleting file: {delete_err}")
            sys.exit(1)
        try:
            repo.create_file(
                file_path,
                f"Create new whitelist file for wallet {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"Whitelist updated for wallet {wallet_address} (file deleted and recreated).")
        except Exception as create_err:
            print(f"Error creating file: {create_err}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet_address = sys.argv[1]
    update_whitelist(wallet_address)
