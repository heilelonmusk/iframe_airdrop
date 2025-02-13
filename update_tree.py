#!/usr/bin/env python3
import subprocess
import os
import sys
import argparse
import yaml

def run_command(cmd):
    """Esegue un comando in shell e restituisce il risultato."""
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result

def load_config(config_file="config.yaml"):
    if not os.path.exists(config_file):
        print(f"File di configurazione '{config_file}' non trovato!")
        sys.exit(1)
    with open(config_file, "r") as f:
        return yaml.safe_load(f)

def generate_tree(tree_cmd):
    result = run_command(tree_cmd)
    if result.returncode != 0:
        print("Errore nell'esecuzione del comando per generare il tree. Assicurati che il comando sia corretto e installato.")
        sys.exit(1)
    return result.stdout

def file_changed(file_path, new_content):
    if not os.path.exists(file_path):
        return True
    with open(file_path, "r") as f:
        old_content = f.read()
    return old_content != new_content

def main():
    # Se la variabile SKIP_TREE_UPDATE è impostata, esce per evitare loop
    if os.environ.get("SKIP_TREE_UPDATE") == "1":
        print("SKIP_TREE_UPDATE impostato, salto l'aggiornamento per evitare loop.")
        sys.exit(0)
    
    parser = argparse.ArgumentParser(
        description="Aggiorna il file_tree.txt con la struttura corrente del repository"
    )
    parser.add_argument(
        "--commit", 
        action="store_true", 
        help="Esegue commit e push automatico delle modifiche"
    )
    parser.add_argument(
        "--config", 
        default="config.yaml", 
        help="File di configurazione YAML (default: config.yaml)"
    )
    parser.add_argument(
        "--output", 
        default="file_tree.txt", 
        help="Nome del file in cui salvare la struttura (default: file_tree.txt)"
    )
    args = parser.parse_args()
    config = load_config(args.config)
    
    # Abilita commit automatico se richiesto via flag, configurazione o variabile d'ambiente.
    commit_auto = args.commit or config.get("commit", False) or os.environ.get("AUTO_COMMIT") == "1"

    # Se siamo in ambiente Netlify, disabilita il commit per evitare conflitti nel deploy.
    if os.environ.get("NETLIFY", "false").lower() == "true":
        print("Ambiente Netlify rilevato: disabilito commit automatico per evitare conflitti con il deploy.")
        commit_auto = False

    git_email = config.get("git", {}).get("user_email", "auto@local.com")
    git_name  = config.get("git", {}).get("user_name", "Auto Commit")
    tree_cmd  = config.get("tree_command", "tree -a")
    
    new_tree = generate_tree(tree_cmd)
    
    if file_changed(args.output, new_tree):
        with open(args.output, "w") as f:
            f.write(new_tree)
        print(f"Il file '{args.output}' è stato aggiornato.")
        
        if commit_auto:
            print("Eseguo commit e push delle modifiche...")
            run_command(f'git config user.email "{git_email}"')
            run_command(f'git config user.name "{git_name}"')
            subprocess.run(f"git add {args.output}", shell=True)
            commit_result = subprocess.run('git commit -m "Aggiornamento file tree"', shell=True)
            if commit_result.returncode == 0:
                # Imposta la variabile per evitare che il nuovo commit inneschi un loop
                os.environ["SKIP_TREE_UPDATE"] = "1"
                subprocess.run("git push", shell=True)
            else:
                print("Nessun cambiamento da committare.")
    else:
        print(f"Nessuna modifica rilevata in '{args.output}'.")

if __name__ == "__main__":
    main()