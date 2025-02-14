#!/usr/bin/env python3
import os
import sys
import argparse
import yaml

def load_config(config_file="config.yaml"):
    if not os.path.exists(config_file):
        print(f"File di configurazione '{config_file}' non trovato!")
        sys.exit(1)
    with open(config_file, "r") as f:
        return yaml.safe_load(f)

def count_files_in_directory(directory):
    """Conta il numero totale di file in una cartella e nelle sue sottocartelle."""
    count = 0
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def generate_tree(root_dir, max_files=100):
    """
    Genera la struttura del repository, raggruppando cartelle con troppi file.
    """
    tree_structure = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Rimuove le cartelle da ignorare (come .git e venv)
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'venv']]

        # Conta i file nella cartella corrente
        total_files = len(filenames)
        for d in dirnames:
            sub_dir = os.path.join(dirpath, d)
            total_files += count_files_in_directory(sub_dir)

        # Normalizza il percorso per una visualizzazione più chiara
        relative_path = os.path.relpath(dirpath, root_dir)
        if relative_path == ".":
            relative_path = root_dir

        # Se il numero di file è alto, raggruppa la cartella
        if total_files > max_files:
            tree_structure.append(f"{relative_path}/  [Troppi file, omessi: {total_files}]")
        else:
            tree_structure.append(f"{relative_path}/")
            for filename in filenames:
                tree_structure.append(f"{relative_path}/{filename}")

    return "\n".join(tree_structure)

def file_changed(file_path, new_content):
    if not os.path.exists(file_path):
        return True
    with open(file_path, "r") as f:
        old_content = f.read()
    return old_content != new_content

def main():
    parser = argparse.ArgumentParser(
        description="Aggiorna il file_tree.txt con la struttura corrente del repository, raggruppando cartelle con troppi file."
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

    commit_auto = args.commit or config.get("commit", False) or os.environ.get("AUTO_COMMIT") == "1"
    root_dir = "."
    max_files = config.get("max_files_per_folder", 100)

    new_tree = generate_tree(root_dir, max_files)

    if file_changed(args.output, new_tree):
        with open(args.output, "w") as f:
            f.write(new_tree)
        print(f"Il file '{args.output}' è stato aggiornato.")

        if commit_auto:
            print("Eseguo commit e push delle modifiche...")
            os.system("git add file_tree.txt")
            commit_result = os.system('git commit -m "Aggiornamento file tree"')
            if commit_result == 0:
                os.system("git push")
            else:
                print("Nessun cambiamento da committare.")
    else:
        print(f"Nessuna modifica rilevata in '{args.output}'.")

if __name__ == "__main__":
    main()