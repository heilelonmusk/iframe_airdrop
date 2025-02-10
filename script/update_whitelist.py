#!/usr/bin/env python3
import sys
import csv
import io
from datetime import datetime
import github3
import os

def update_whitelist(wallet_address):
    GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
    GITHUB_REPO = "heilelonmusk/iframe_airdrop"
    BRANCH = "main"
    
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
        file_content = repo.file_contents(file_path, ref=BRANCH)
        csv_data = file_content.decoded.decode("utf-8")
    except github3.exceptions.NotFoundError:
        print("Whitelist file not found, creating a new file.")
        csv_data = "Wallet Address,Checked,DateTime\n"
        file_content = None

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
        print(f"Wallet address {wallet_address} not found in whitelist.")
        return False

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    new_csv = output.getvalue().encode("utf-8")
    
    # Tenta update_file, fallback in caso di errore
    try:
        if file_content:
            repo.update_file(
                file_path,
                f"Update whitelist for {wallet_address}",
                new_csv,
                file_content.sha,
                branch=BRANCH
            )
            print(f"Whitelist updated for wallet {wallet_address}.")
        else:
            repo.create_file(
                file_path,
                f"Create whitelist for {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"Whitelist created and updated for {wallet_address}.")
        return True
    except Exception as e:
        print(f"update_file failed: {e}")
        print("Attempting fallback: delete + create...")

        if file_content:
            try:
                file_content.delete("Delete old whitelist for fallback", branch=BRANCH)
                print("Old whitelist file deleted.")
            except Exception as delete_err:
                print(f"Error deleting file: {delete_err}")
                sys.exit(1)

        # Ricrea il file
        try:
            repo.create_file(
                file_path,
                f"Recreate whitelist for {wallet_address}",
                new_csv,
                branch=BRANCH
            )
            print(f"Whitelist recreated and updated for {wallet_address}.")
        except Exception as create_err:
            print(f"Error creating file: {create_err}")
            sys.exit(1)

        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a wallet address as an argument.")
        sys.exit(1)
    wallet_address = sys.argv[1]
    update_whitelist(wallet_address)
