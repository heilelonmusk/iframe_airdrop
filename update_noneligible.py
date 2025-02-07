import sys
import csv
import io
from datetime import datetime
import github3
import os

def update_non_eligible(wallet_address):
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
    
    # Prova a leggere il contenuto attuale del file non_eligible.csv.
    # Se il file non esiste, inizializza csv_data con l'intestazione.
    try:
        file_content = repo.file_contents(file_path, ref=BRANCH)
        csv_data = file_content.decoded.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("non_eligible.csv not found, creating a new file.")
        csv_data = "Wallet Address,DateTime\n"
        file_content = None  # Indica che il file non esiste ancora

    # Leggi i dati CSV in memoria e raccogli gli indirizzi già registrati.
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    
    # Se il wallet è già presente, esci senza duplicati.
    for row in rows:
        if row["Wallet Address"].strip().lower() == wallet_address.strip().lower():
            print(f"Wallet {wallet_address} is already recorded in non_eligible.csv.")
            sys.exit(0)
    
    # Aggiungi una nuova riga con il wallet e il timestamp corrente.
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_row = {"Wallet Address": wallet_address, "DateTime": timestamp}
    
    # Se il file non esiste, prepariamo la lista con un'unica riga; altrimenti, aggiungiamo alla lista esistente.
    if file_content is None:
        rows = [new_row]
        fieldnames = ["Wallet Address", "DateTime"]
    else:
        rows.append(new_row)
        # Se per qualche motivo i fieldnames non sono stati definiti, usiamo quelli standard.
        fieldnames = reader.fieldnames if reader.fieldnames else ["Wallet Address", "DateTime"]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    # Aggiorna il file su GitHub:
    # Se il file esiste, prova ad aggiornare; se non funziona, usa il fallback di eliminare e ricrearlo.
    if file_content is not None:
        try:
            repo.update_file(
                file_path,
                f"Update non_eligible.csv: add {wallet_address}",
                new_csv,  # new_csv è in formato bytes
                file_content.sha,
                branch=BRANCH
            )
            print(f"Wallet {wallet_address} added to non_eligible.csv.")
        except Exception as e:
            print(f"Error updating non_eligible.csv with update_file: {e}")
            print("Attempting fallback: delete and recreate the file...")
            try:
                # Utilizza il metodo delete() sull'oggetto file_content.
                file_content.delete(f"Delete old non_eligible.csv for {wallet_address}", branch=BRANCH)
            except Exception as delete_err:
                print(f"Error deleting file: {delete_err}")
                sys.exit(1)
            try:
                repo.create_file(
                    file_path,
                    f"Create non_eligible.csv with {wallet_address}",
                    new_csv,
                    branch=BRANCH
                )
                print(f"Wallet {wallet_address} added to non_eligible.csv (deleted and recreated).")
            except Exception as create_err:
                print(f"Error creating file: {create_err}")
                sys.exit(1)
    else:
        # Se il file non esiste, crealo
        try:
            repo.create_file(
                file_path,
                f"Create non_eligible.csv with {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"non_eligible.csv created and wallet {wallet_address} added.")
        except Exception as create_err:
            print(f"Error creating file: {create_err}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet_address = sys.argv[1]
    update_non_eligible(wallet_address)
