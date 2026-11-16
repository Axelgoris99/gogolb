#!/usr/bin/env bash
# Copy the skin system from the portfolio repo, which owns it, so the blog
# looks the same. Usage: ./scripts/sync-skins.sh [path to personal_website]
set -euo pipefail
cd "$(dirname "$0")/.."
src="${1:-../personal_website}"

rsync -a --delete "$src/src/styles/skins/" src/styles/skins/
cp "$src/src/styles/global.css" src/styles/global.css
rsync -a --delete "$src/public/assets/skins/" public/assets/skins/
rsync -a --delete "$src/public/assets/backgrounds/" public/assets/backgrounds/

# Same skins, but the blog starts on the minimal one.
sed 's/^export const defaultSkin = .*/export const defaultSkin = "minimal";/' \
  "$src/src/skins.ts" > src/skins.ts

echo "Synced skins from $src"
