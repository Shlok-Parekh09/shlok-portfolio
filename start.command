#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Shlok's Portfolio..."
open http://127.0.0.1:3000/
node scripts/server.mjs
