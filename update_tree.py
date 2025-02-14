#!/usr/bin/env python3
import os
import sys
import argparse
import yaml

DESCRIPTION_PLACEHOLDER = "🚀 Add a description here"

def load_config(config_file="config.yaml"):
    """Loads configuration from YAML file."""
    if not os.path.exists(config_file):
        print(f"Configuration file '{config_file}' not found!")
        sys.exit(1)
    with open(config_file, "r") as f:
        return yaml.safe_load(f)

def load_descriptions(desc_file="descriptions.yaml"):
    """Loads file and folder descriptions from YAML file."""
    if os.path.exists(desc_file):
        with open(desc_file, "r") as f:
            return yaml.safe_load(f).get("descriptions", {})
    return {}

def save_descriptions(desc_file, descriptions):
    """Saves updated descriptions back to the YAML file."""
    with open(desc_file, "w") as f:
        yaml.dump({"descriptions": descriptions}, f, default_flow_style=False, sort_keys=True)

def count_files_in_directory(directory):
    """Counts the total number of files in a directory and its subdirectories."""
    count = 0
    for _, _, files in os.walk(directory):
        count += len(files)
    return count

def generate_tree(root_dir, descriptions, indent=""):
    """
    Generates the directory tree structure with descriptions.
    `node_modules/` is displayed as a single entry.
    """
    tree_structure = []
    new_descriptions = False

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'venv']]

        relative_path = os.path.relpath(dirpath, root_dir)
        if relative_path == ".":
            relative_path = root_dir

        if relative_path + "/" not in descriptions:
            descriptions[relative_path + "/"] = DESCRIPTION_PLACEHOLDER
            new_descriptions = True

        desc = descriptions.get(relative_path + "/", "")

        if "node_modules" in dirnames:
            node_modules_path = os.path.join(dirpath, "node_modules")
            total_files = count_files_in_directory(node_modules_path)
            node_desc = descriptions.get("node_modules/", "External dependencies")
            tree_structure.append(f"{indent}📁 node_modules/  [Hidden, {total_files} files omitted] - {node_desc}")
            dirnames.remove("node_modules")

        tree_structure.append(f"{indent}📁 {relative_path}/ - {desc}")

        for filename in filenames:
            file_path = os.path.join(relative_path, filename)
            if file_path not in descriptions:
                descriptions[file_path] = DESCRIPTION_PLACEHOLDER
                new_descriptions = True

            file_desc = descriptions.get(file_path, "")
            tree_structure.append(f"{indent}   📄 {filename} - {file_desc}")

    return "\n".join(tree_structure), new_descriptions

def file_changed(file_path, new_content):
    """Checks if the file content has changed."""
    if not os.path.exists(file_path):
        return True
    with open(file_path, "r") as f:
        old_content = f.read()
    return old_content != new_content

def main():
    parser = argparse.ArgumentParser(
        description="Generates an updated file_tree.txt with a structured view and descriptions."
    )
    parser.add_argument("--commit", action="store_true", help="Automatically commits and pushes changes")
    parser.add_argument("--config", default="config.yaml", help="YAML configuration file (default: config.yaml)")
    parser.add_argument("--output", default="file_tree.txt", help="Output file name (default: file_tree.txt)")
    args = parser.parse_args()

    config = load_config(args.config)
    commit_auto = args.commit or config.get("commit", False) or os.environ.get("AUTO_COMMIT") == "1"
    root_dir = "."

    descriptions = load_descriptions()
    new_tree, new_entries = generate_tree(root_dir, descriptions, indent="  ")

    if new_entries:
        print("🔍 New files detected! Updating descriptions.yaml...")
        save_descriptions("descriptions.yaml", descriptions)

    if file_changed(args.output, new_tree):
        with open(args.output, "w") as f:
            f.write(new_tree)
        print(f"📁 File '{args.output}' has been updated.")

        if commit_auto:
            print("🚀 Committing and pushing changes...")
            os.system("git add file_tree.txt descriptions.yaml")
            commit_result = os.system('git commit -m "Updated file tree and descriptions"')
            if commit_result == 0:
                os.system("git push")
            else:
                print("⚠️ No changes to commit.")
    else:
        print(f"✅ No modifications detected in '{args.output}'.")

if __name__ == "__main__":
    main()