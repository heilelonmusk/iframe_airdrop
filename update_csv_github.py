import os
import github3

# ------------------------------
# CONFIGURAZIONE
# ------------------------------

# Legge il token GitHub dalla variabile d'ambiente (MY_GITHUB_TOKEN)
GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
GITHUB_REPO = "heilelonmusk/iframe_airdrop"  # Nome del repository su GitHub
BRANCH = "main"  # Branch su cui caricare i file

if not GITHUB_TOKEN:
    print("❌ ERRORE: Token GitHub non trovato. Assicurati di averlo impostato come MY_GITHUB_TOKEN.")
    exit(1)

# ------------------------------
# CONNESSIONE A GITHUB
# ------------------------------

try:
    gh = github3.login(token=GITHUB_TOKEN)
    if gh is None:
        raise ValueError("Autenticazione GitHub fallita.")
except Exception as e:
    print(f"❌ ERRORE: {e}")
    exit(1)

repo = gh.repository(*GITHUB_REPO.split("/"))
if repo is None:
    print("❌ ERRORE: Repository non trovato. Controlla il nome del repository.")
    exit(1)

# ------------------------------
# FUNZIONE DI UPLOAD SU GITHUB
# ------------------------------

def upload_to_github(local_file, github_file):
    """
    Carica o aggiorna un file su GitHub.
    - local_file: percorso (nome) del file locale.
    - github_file: percorso (nome) del file nel repository (es. "data/whitelist.csv").
    """
    if not os.path.exists(local_file):
        print(f"⚠️ ATTENZIONE: Il file '{local_file}' non esiste. Salto l'upload.")
        return

    try:
        # Prova a leggere il file dal repository per ottenere lo SHA
        file_content = repo.file_contents(github_file, ref=BRANCH)
        sha = file_content.sha

        with open(local_file, "rb") as file:
            content = file.read()

        # Aggiorna il file esistente
        repo.update_file(
            github_file,                      # Percorso nel repository
            f"Aggiornamento {github_file}",   # Messaggio di commit
            content,                          # Nuovo contenuto
            sha,                              # SHA della versione precedente
            branch=BRANCH
        )
        print(f"📤 {github_file} aggiornato su GitHub!")
    except github3.exceptions.NotFoundError:
        # Se il file non esiste, lo crea
        with open(local_file, "rb") as file:
            content = file.read()

        repo.create_file(
            github_file,                      # Percorso nel repository
            f"Creazione {github_file}",       # Messaggio di commit
            content,                          # Contenuto del file
            branch=BRANCH
        )
        print(f"📤 {github_file} caricato su GitHub per la prima volta!")
    except Exception as e:
        print(f"❌ ERRORE durante l'upload di {github_file}: {e}")

# ------------------------------
# ESECUZIONE DELL'UPLOAD
# ------------------------------

upload_to_github("whitelist.csv", "data/whitelist.csv")
upload_to_github("non_eligible.csv", "data/non_eligible.csv")
upload_to_github("iframe_settings.csv", "data/iframe_settings.csv")