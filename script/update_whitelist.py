name: Update Whitelist via Dispatch

on:
  repository_dispatch:
    types: [ update_whitelist ]

jobs:
  update-whitelist:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.x"

      - name: Install Dependencies
        run: pip install github3.py

      - name: Run Update Script
        env:
          MY_GITHUB_TOKEN: ${{ secrets.MY_GITHUB_TOKEN }}
        run: python scripts/update_whitelist.py "${{ github.event.client_payload.wallet }}"
