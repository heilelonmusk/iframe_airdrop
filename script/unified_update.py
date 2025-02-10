#!/usr/bin/env python3
import sys
from update_whitelist import update_whitelist
from update_noneligible import update_noneligible

if len(sys.argv) < 2:
    print("Usage: python unified_update.py <wallet_address>")
    sys.exit(1)

wallet_address = sys.argv[1]

# Tenta update_whitelist, se restituisce False => non era in whitelist
if not update_whitelist(wallet_address):
    update_noneligible(wallet_address)
