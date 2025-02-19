import sys
import csv
import io
from datetime import datetime
import github3
import os

def update_noneligible(wallet_address):
    # Configurazione
    GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
    GITHUB_REPO = "heilelonmusk/iframe_airdrop"
    BRANCH = "main"
    
    # Autenticazione su GitHub
    gh = github3.login(token=GITHUB_TOKEN)
    if gh is None:
        print("Authentication failed.")
        sys.exit(1)
    
    repo = gh.repository(*GITHUB_REPO.split("/"))
    if repo is None:
        print("Repository not found.")
        sys.exit(1)
    
    file_path = "data/non_eligible.csv"
    try:
        # Prova a leggere il file esistente
        file_content = repo.file_contents(file_path, ref=BRANCH)
        csv_data = file_content.decoded.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("non_eligible.csv not found, creating a new file.")
        csv_data = "Wallet Address,DateTime\n"
        file_content = None

    # Legge i dati CSV
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    
    # Controlla se il wallet è già registrato
    for row in rows:
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            print(f"Wallet {wallet_address} is already recorded in non_eligible.csv.")
            return

    # Aggiunge una nuova riga con il timestamp corrente
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_row = {"Wallet Address": wallet_address, "DateTime": timestamp}
    rows.append(new_row)
    fieldnames = reader.fieldnames if reader.fieldnames else ["Wallet Address", "DateTime"]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    if file_content:
        try:
            repo.update_file(
                file_path,
                f"Update non_eligible for wallet {wallet_address}",
                new_csv,
                file_content.sha,
                branch=BRANCH
            )
            print(f"Wallet {wallet_address} added to non_eligible.csv.")
        except Exception as e:
            print(f"update_file method failed: {e}. Attempting fallback...")
            try:
                file_content.delete("Delete non_eligible file for update", branch=BRANCH)
            except Exception as delete_err:
                print(f"Error deleting file: {delete_err}")
                sys.exit(1)
            try:
                repo.create_file(
                    file_path,
                    f"Recreate non_eligible.csv with wallet {wallet_address}",
                    new_csv,
                    branch=BRANCH
                )
                print(f"non_eligible.csv recreated and wallet {wallet_address} added.")
            except Exception as create_err:
                print(f"Error creating non_eligible.csv: {create_err}")
                sys.exit(1)
    else:
        try:
            repo.create_file(
                file_path,
                f"Create non_eligible.csv with wallet {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"non_eligible.csv created and wallet {wallet_address} added.")
        except Exception as e:
            print(f"Error creating non_eligible.csv: {e}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet = sys.argv[1]
    update_noneligible(wallet)
