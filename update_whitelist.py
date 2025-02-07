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
        # Usa la proprietà "decoded" per ottenere il contenuto in bytes e poi decodificarlo in stringa UTF-8
        csv_data = file_content.decoded.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("Whitelist file not found.")
        sys.exit(1)
    
    # Leggi i dati CSV in memoria
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    
    updated = False
    for row in rows:
        # Confronta in modo case-insensitive
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            row["Checked"] = "true"
            now = datetime.now()
            row["DateTime"] = now.strftime("%Y-%m-%d %H:%M:%S")
            updated = True
            break

    if not updated:
        print(f"Wallet address {wallet_address} not found in whitelist.")
        sys.exit(1)
    
    # Scrivi i dati aggiornati in una stringa CSV e codificala in bytes
    output = io.StringIO()
    fieldnames = reader.fieldnames
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    # Aggiorna il file su GitHub utilizzando il metodo update_file()
    try:
        repo.update_file(
            file_path,
            f"Update whitelist for wallet {wallet_address}",
            new_csv,  # new_csv è già in formato bytes
            file_content.sha,
            branch=BRANCH
        )
        print(f"Whitelist updated for wallet {wallet_address}.")
    except AttributeError as ae:
        # Se update_file non è disponibile, usa il fallback: elimina il file e ricrealo
        print("update_file method not available, attempting to delete and recreate the file...")
        try:
            # Usa il metodo delete() sull'oggetto file_content
            file_content.delete(f"Delete old whitelist for wallet {wallet_address}", branch=BRANCH)
        except Exception as delete_err:
            print(f"Error deleting file: {delete_err}")
            sys.exit(1)
        try:
            repo.create_file(
                file_path,
                f"Create new whitelist for wallet {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"Whitelist updated for wallet {wallet_address} (deleted and recreated).")
        except Exception as create_err:
            print(f"Error creating file: {create_err}")
            sys.exit(1)
    except Exception as e:
        print(f"Error updating whitelist: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet_address = sys.argv[1]
    update_whitelist(wallet_address)
