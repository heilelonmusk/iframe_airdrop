#!/usr/bin/env python3
import sys
import csv
import io
import os
from datetime import datetime
import github3

def main():
    # Configurazione
    TOKEN = os.getenv("MY_GITHUB_TOKEN")
    if not TOKEN:
        print("MY_GITHUB_TOKEN is not set!")
        sys.exit(1)

    REPO_OWNER = "heilelonmusk"
    REPO_NAME = "iframe_airdrop"
    BRANCH = "main"

    # Autenticazione su GitHub
    gh = github3.login(token=TOKEN)
    if gh is None:
        print("Authentication failed.")
        sys.exit(1)
    repo = gh.repository(REPO_OWNER, REPO_NAME)
    if repo is None:
        print("Repository not found.")
        sys.exit(1)
    
    # Recupera l'indirizzo wallet dalla riga di comando
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet = sys.argv[1]
    
    # Prova ad aggiornare la whitelist; se il wallet non è presente, aggiorna i non eligible.
    if update_whitelist(repo, BRANCH, wallet):
        sys.exit(0)
    else:
        update_noneligible(repo, BRANCH, wallet)
    
def update_file(repo, branch, file_path, new_csv, sha):
    """
    Prova ad aggiornare il file tramite update_file; in caso di errore, tenta di eliminarlo e ricrearlo.
    """
    try:
        repo.update_file(file_path, "Automated update", new_csv, sha, branch=branch)
        return True
    except Exception as e:
        print(f"update_file method not available or failed: {e}")
        print("Attempting fallback: delete and recreate the file...")
        try:
            file_content = repo.file_contents(file_path, ref=branch)
            file_content.delete("Delete file for update", branch=branch)
        except Exception as delete_err:
            print(f"Error deleting file: {delete_err}")
            return False
        try:
            repo.create_file(file_path, "Recreate file after update", new_csv, branch=branch)
            return True
        except Exception as create_err:
            print(f"Error creating file: {create_err}")
            return False

def update_whitelist(repo, branch, wallet_address):
    """
    Aggiorna la whitelist: se il wallet è presente in data/whitelist.csv,
    imposta 'Checked' a "true" e aggiorna il timestamp.
    Restituisce True se il wallet è stato trovato (e aggiornato), altrimenti False.
    """
    file_path = "data/whitelist.csv"
    try:
        file_content = repo.file_contents(file_path, ref=branch)
        # Prova ad ottenere il contenuto decodificato; se il metodo 'decoded' non è presente, prova 'decoded_content'
        try:
            csv_data = file_content.decoded.decode("utf-8")
        except AttributeError:
            csv_data = file_content.decoded_content.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("Whitelist file not found.")
        sys.exit(1)
    
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    found = False
    for row in rows:
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            row["Checked"] = "true"
            row["DateTime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            found = True
            break

    if not found:
        return False  # Indica che il wallet non è presente nella whitelist

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    if update_file(repo, branch, file_path, new_csv, file_content.sha):
        print(f"Whitelist updated for wallet {wallet_address}.")
    else:
        print("Error updating whitelist.")
        sys.exit(1)
    return True

def update_noneligible(repo, branch, wallet_address):
    """
    Aggiorna (o crea) il file data/non_eligible.csv aggiungendo il wallet e il timestamp, se non già presente.
    """
    file_path = "data/non_eligible.csv"
    # Prova a leggere il file, altrimenti inizializzalo con l'intestazione
    try:
        file_content = repo.file_contents(file_path, ref=branch)
        try:
            csv_data = file_content.decoded.decode("utf-8")
        except AttributeError:
            csv_data = file_content.decoded_content.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("non_eligible.csv not found, creating a new file.")
        csv_data = "Wallet Address,DateTime\n"
        file_content = None

    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    # Controlla se il wallet è già presente
    for row in rows:
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            print(f"Wallet {wallet_address} is already recorded in non_eligible.csv.")
            return

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
        if update_file(repo, branch, file_path, new_csv, file_content.sha):
            print(f"Wallet {wallet_address} added to non_eligible.csv.")
        else:
            print("Error updating non_eligible.csv.")
            sys.exit(1)
    else:
        try:
            repo.create_file(file_path, f"Create non_eligible.csv with {wallet_address}", new_csv, branch=branch)
            print(f"non_eligible.csv created and wallet {wallet_address} added.")
        except Exception as e:
            print(f"Error creating non_eligible.csv: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
