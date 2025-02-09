#!/usr/bin/env python3
import os
import requests
import github3

GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
GITHUB_REPO = "heilelonmusk/iframe_airdrop"
BRANCH = "main"

if not GITHUB_TOKEN:
    print("❌ Token GitHub non trovato.")
    exit(1)

try:
    gh = github3.login(token=GITHUB_TOKEN)
    if gh is None:
        raise ValueError("Autenticazione fallita.")
except Exception as e:
    print(f"❌ Errore: {e}")
    exit(1)

repo = gh.repository(*GITHUB_REPO.split("/"))
if repo is None:
    print("❌ Repository non trovato.")
    exit(1)

# Link per i file CSV
WHITELIST_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZ6WoIqrzoUdPh922uKFA08fuTTOWH2xreDmx18E2lpGioH9z_eVJ034ul3DJixg/pub?output=csv"
NON_ELIGIBLE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHfqtGOIR-87zaRJhuqjN70N-tRSe2QOV6lb-vfECg9SqJ6q3aclTVp6vJDaGgIg/pub?output=csv"
IFRAME_SETTINGS_URL = "https://drive.google.com/uc?export=download&id=12qqeSqcli6NNbD7dx8wr7S0mmx_OSZAz"

def update_csv(file_url, output_filename):
    try:
        response = requests.get(file_url)
        response.raise_for_status()
        with open(output_filename, "wb") as file:
            file.write(response.content)
        print(f"✅ {output_filename} aggiornato!")
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore nel download di {output_filename}: {e}")

update_csv(WHITELIST_URL, "whitelist.csv")
update_csv(NON_ELIGIBLE_URL, "non_eligible.csv")
update_csv(IFRAME_SETTINGS_URL, "iframe_settings.csv")

def upload_to_github(local_file, github_file):
    if not os.path.exists(local_file):
        print(f"⚠️ Il file '{local_file}' non esiste. Salto l'upload.")
        return
    try:
        file_content = repo.file_contents(github_file, ref=BRANCH)
        sha = file_content.sha
        with open(local_file, "rb") as file:
            content = file.read()
        repo.update_file(github_file, f"Aggiornamento {github_file}", content, sha, branch=BRANCH)
        print(f"📤 {github_file} aggiornato su GitHub!")
    except github3.exceptions.NotFoundError:
        with open(local_file, "rb") as file:
            content = file.read()
        repo.create_file(github_file, f"Creazione {github_file}", content, branch=BRANCH)
        print(f"📤 {github_file} creato su GitHub!")
    except Exception as e:
        print(f"❌ Errore durante l'upload di {github_file}: {e}")

upload_to_github("whitelist.csv", "data/whitelist.csv")
upload_to_github("non_eligible.csv", "data/non_eligible.csv")
upload_to_github("iframe_settings.csv", "data/iframe_settings.csv")
