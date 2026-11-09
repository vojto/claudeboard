# Claudeboard

A Tauri 2 + React + TypeScript + Tailwind app that shows the Claude desktop app's sessions as a kanban board. See README.md for what it does and how it works.

## Layout

- `src-tauri/src/lib.rs` — Rust commands: list live sessions, open a session via `claude://`, load/save the board.
- `hooks/claudeboard-hook.sh` + `scripts/install-hooks.mjs` — Claude Code hooks that mark a session as "Needs you" (a file in `~/.claude/claudeboard/waiting/`). Re-run the installer after changing the hook.
- `src/lib/board.ts` — board data model and pure functions that change it.
- `src/lib/use-board.ts` — loads the board, polls sessions every 2s, saves changes.
- `src/screens/` — screens. `src/components/` — app components. `src/ui/` — generic styled base-ui parts.
- `docs/demo.html` + `scripts/screenshots.sh` — README screenshots with fake sessions. Never put real session titles in screenshots, the repo is public.

## Conventions

- Prettier, no semicolons: `pnpm format`.
- Kebab-case file names, one component per file.
- Menus and other UI primitives use base-ui. Drag and drop uses dnd-kit.

## After every change

Once a change is done and typechecks, without asking:

1. Commit it on `main` and push.
2. Deploy it (below).

## Deploy

Run:

```bash
scripts/deploy.sh
```

It builds the production app, quits the running Claudeboard, replaces `/Applications/Claudeboard.app` with the new build, and opens it.

## Git

The repo is public at github.com/vojto/claudeboard. Work directly on `main`, no branches or PRs.
