#!/usr/bin/env bash
set -euo pipefail

VPS="ovh"
REMOTE_DIR="/home/debian/blog"

echo "==> Building..."
npm run build

echo "==> Syncing site..."
rsync -az --delete --progress dist/ "$VPS:$REMOTE_DIR/"

echo "==> Done. https://blog.goris.live"
