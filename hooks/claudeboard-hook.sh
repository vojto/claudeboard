#!/bin/sh
# Claudeboard hook. Claude Code runs it at certain moments (see scripts/install-hooks.mjs).
# `set` marks the session as waiting for you (a question or a permission prompt).
# `clear` removes the mark. The mark is an empty file named after the session id,
# in ~/.claude/claudeboard/waiting/. Claudeboard looks for it when it polls.
dir="$HOME/.claude/claudeboard/waiting"
id=$(sed -n 's/.*"session_id" *: *"\([A-Za-z0-9-]*\)".*/\1/p' | head -n 1)
[ -z "$id" ] && exit 0
mkdir -p "$dir"
if [ "$1" = "set" ]; then touch "$dir/$id"; else rm -f "$dir/$id"; fi
exit 0
