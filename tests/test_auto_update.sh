#!/bin/bash
echo "🔍 Running auto-update verification..."

echo "✅ Step 1: Running initial update"
python3 update_tree.py --commit

echo "✅ Step 2: Adding new files..."
touch src/test_script.js
mkdir example_folder
touch example_folder/example.py
python3 update_tree.py --commit

echo "✅ Step 3: Checking descriptions.yaml"
grep "🚀 Add a description here" descriptions.yaml

echo "✅ Step 4: Modifying a description"
sed -i '' 's/🚀 Add a description here/Handles API authentication/' descriptions.yaml
python3 update_tree.py --commit

echo "✅ Step 5: Deleting a file..."
rm src/test_script.js
python3 update_tree.py --commit

echo "✅ Step 6: Checking git status..."
git status

echo "✅ Step 7: Checking commit log..."
git log --oneline -n 5

echo "🎯 Auto-update test complete!"