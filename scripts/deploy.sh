#!/bin/bash
# Deploys Claudeboard to this Mac: builds the production app, quits the running copy,
# replaces /Applications/Claudeboard.app with the new build, and opens it.
# The board itself lives in ~/Library/Application Support/net.rinik.claudeboard, so it survives.
set -euo pipefail
cd "$(dirname "$0")/.."

APP="/Applications/Claudeboard.app"

pnpm tauri build --bundles app

pkill -f "$APP/Contents/MacOS/" || true
while pgrep -f "$APP/Contents/MacOS/" >/dev/null; do sleep 0.2; done

rm -rf "$APP"
cp -R src-tauri/target/release/bundle/macos/Claudeboard.app "$APP"
open "$APP"
echo "Deployed $APP"
