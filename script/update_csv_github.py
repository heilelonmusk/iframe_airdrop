#!/usr/bin/env python3
import os
import requests
import github3

def main():
    GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
    GITHUB_REPO = "heilelonmusk/iframe_airdrop"
    BRANCH = "main"

    if not GITHUB_TOKEN:
        print("❌ Token GitHub non trovato.")
        return
    
    try:
        gh = github3.login(token=GITHUB_TOKEN)
        if gh is None:
            raise ValueError("Autenticazione fallita.")
    except Exception as e:
        print(f"❌ Errore: {e}")
        return

    repo = gh.repository(*GITHUB_REPO.split("/"))
    if repo is None:
        print("❌ Repository non trovato.")
        return

    # Sorgenti CSV (se li scarichi da altrove)
    WHITELIST_URL = "https://docs.google.com/spreadsheets/d/e/xxx/pub?output=csv"
    NON_ELIGIBLE_URL = "https://docs.google.com/spreadsheets/d/e/yyy/pub?output=csv"

    # Scarica e aggiorna file
    download_and_update(repo, WHITELIST_URL, "data/whitelist.csv", BRANCH)
    download_and_update(repo, NON_ELIGIBLE_URL, "data/non_eligible.csv", BRANCH)

def download_and_update(repo, file_url, github_file, branch):
    local_file = github_file.split("/")[-1]  # estrae ad es. "whitelist.csv"
    try:
        r = requests.get(file_url)
        r.raise_for_status()
        with open(local_file, "wb") as f:
            f.write(r.content)
        print(f"Scaricato {local_file} da {file_url}")
    except Exception as e:
        print(f"Errore nel download di {local_file}: {e}")
        return

    # Ora tenta di caricare su GitHub (con fallback)
    try:
        file_content = repo.file_contents(github_file, ref=branch)
        sha = file_content.sha
        with open(local_file, "rb") as f:
            content = f.read()
        try:
            repo.update_file(
                github_file,
                f"Aggiornamento {github_file}",
                content,
                sha,
                branch=branch
            )
            print(f"📤 {github_file} aggiornato su GitHub!")
        except Exception as ue:
            print(f"update_file failed: {ue}")
            print("Attempting fallback: delete + create...")

            if file_content:
                try:
                    file_content.delete(f"Delete old {github_file} for fallback", branch=branch)
                    print(f"Old {github_file} deleted.")
                except Exception as del_err:
                    print(f"Error deleting file: {del_err}")
                    return

            try:
                repo.create_file(
                    github_file,
                    f"Creazione {github_file}",
                    content,
                    branch=branch
                )
                print(f"📤 {github_file} creato su GitHub in fallback!")
            except Exception as create_err:
                print(f"Error creating file in fallback: {create_err}")

    except github3.exceptions.NotFoundError:
        # Il file non esiste su GitHub, creiamo direttamente
        with open(local_file, "rb") as f:
            content = f.read()
        try:
            repo.create_file(
                github_file,
                f"Creazione {github_file}",
                content,
                branch=branch
            )
            print(f"📤 {github_file} creato su GitHub per la prima volta!")
        except Exception as e:
            print(f"❌ ERRORE durante l'upload di {github_file}: {e}")

if __name__ == "__main__":
    main()
