#!/usr/bin/env python3
import os
import sys
import argparse
import yaml

def load_config(config_file="config.yaml"):
    """Loads configuration from YAML file."""
    if not os.path.exists(config_file):
        print(f"Configuration file '{config_file}' not found!")
        sys.exit(1)
    with open(config_file, "r") as f:
        return yaml.safe_load(f)

def count_files_in_directory(directory):
    """Counts the total number of files in a directory and its subdirectories."""
    count = 0
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def generate_tree(root_dir, indent=""):
    """
    Generates the directory tree structure, displaying `node_modules/` in a single line.
    """
    tree_structure = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Exclude unnecessary directories
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'venv']]

        # Normalize path for display
        relative_path = os.path.relpath(dirpath, root_dir)
        if relative_path == ".":
            relative_path = root_dir

        # Display node_modules/ as a single line with file count
        if "node_modules" in dirnames:
            node_modules_path = os.path.join(dirpath, "node_modules")
            total_files = count_files_in_directory(node_modules_path)
            tree_structure.append(f"{indent}📁 {relative_path}/node_modules/  [Hidden, {total_files} files omitted]")
            dirnames.remove("node_modules")  # Prevents further processing of its files

        # Add folder name
        tree_structure.append(f"{indent}📁 {relative_path}/")

        # Add files with indentation
        for filename in filenames:
            tree_structure.append(f"{indent}   📄 {filename}")

    return "\n".join(tree_structure)

def file_changed(file_path, new_content):
    """Checks if the file content has changed."""
    if not os.path.exists(file_path):
        return True
    with open(file_path, "r") as f:
        old_content = f.read()
    return old_content != new_content

def main():
    parser = argparse.ArgumentParser(
        description="Generates an updated file_tree.txt with a structured view, displaying `node_modules/` as a single entry."
    )
    parser.add_argument(
        "--commit", 
        action="store_true", 
        help="Automatically commits and pushes changes"
    )
    parser.add_argument(
        "--config", 
        default="config.yaml", 
        help="YAML configuration file (default: config.yaml)"
    )
    parser.add_argument(
        "--output", 
        default="file_tree.txt", 
        help="Output file name (default: file_tree.txt)"
    )
    args = parser.parse_args()
    config = load_config(args.config)

    commit_auto = args.commit or config.get("commit", False) or os.environ.get("AUTO_COMMIT") == "1"
    root_dir = "."

    new_tree = generate_tree(root_dir, indent="  ")

    if file_changed(args.output, new_tree):
        with open(args.output, "w") as f:
            f.write(new_tree)
        print(f"File '{args.output}' has been updated.")

        if commit_auto:
            print("Committing and pushing changes...")
            os.system("git add file_tree.txt")
            commit_result = os.system('git commit -m "Updated file tree"')
            if commit_result == 0:
                os.system("git push")
            else:
                print("No changes to commit.")
    else:
        print(f"No modifications detected in '{args.output}'.")

if __name__ == "__main__":
    main()