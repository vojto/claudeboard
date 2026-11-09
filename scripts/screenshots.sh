#!/bin/bash
# Retakes the README screenshots in docs/ from the fake-data page docs/demo.html.
# Needs Google Chrome and the Vite dev server running (`pnpm dev` or `pnpm tauri dev`).
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://localhost:1420/docs/demo.html"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

shoot() {
  local out="$1" url="$2"
  shift 2
  "$CHROME" --headless=new --user-data-dir="$PROFILE/$out" --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=1560,480 --virtual-time-budget=3000 "$@" --screenshot="docs/$out" "$url" 2>&1 | grep written
}

shoot board-light.png "$URL"
shoot board-dark.png "$URL" --force-dark-mode --blink-settings=preferredColorScheme=0
shoot context-menu.png "$URL?menu"
