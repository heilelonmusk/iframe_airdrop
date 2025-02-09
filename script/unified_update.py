#!/usr/bin/env python3
import sys
from update_whitelist import update_whitelist
from update_noneligible import update_noneligible

if len(sys.argv) < 2:
    print("Usage: python unified_update.py <wallet_address>")
    sys.exit(1)

wallet = sys.argv[1]
if not update_whitelist(wallet):
    update_noneligible(wallet)
