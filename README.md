# Claudeboard

A kanban board for your [Claude desktop app](https://claude.ai/download) sessions.

Every running Claude Code session shows up as a card. You make the columns and drag the cards around however you like. Each card shows what its session is doing right now.

![Claudeboard](docs/board-light.png)

## What it does

- **Live sessions.** Reads `~/.claude/sessions` every 2 seconds. New sessions land in the **Inbox**.
- **Live state.** Each card is **Busy**, **Idle**, or **Ended** (the session's process is gone).
- **Auto-sorting on state changes.** A card that turns busy jumps to the top of its column. A card that ends drops to the bottom. Otherwise your order stays.
- **Your own columns.** Add, rename, reorder and delete columns. Deleting a column moves its cards back to the Inbox.
- **Right-click a card** to open it in Claude, or archive it. Double-click also opens it.
- **Archive** only hides the card in Claudeboard. It doesn't touch the session in Claude.

![Right-click menu](docs/context-menu.png)

Dark mode follows your system:

![Dark mode](docs/board-dark.png)

## How it works

Claude has no official API for this. Claudeboard uses two undocumented things, so a Claude update could break it:

- Each running session writes `~/.claude/sessions/<pid>.json` with its title, folder, status and `hostSessionId`. Claudeboard keeps files whose process is still alive.
- Opening a card runs `open "claude://code/continue?session=local_…"`. If nothing happens, check that Claude's "entry points" setting is on.

Your board is saved to `~/Library/Application Support/net.rinik.claudeboard/board.json`.

## Running it

You need [Rust](https://rustup.rs), Node and [pnpm](https://pnpm.io). macOS only.

```bash
pnpm install
pnpm tauri dev
```

Build an app bundle:

```bash
pnpm tauri build
```

## Stack

[Tauri 2](https://tauri.app), React, TypeScript, Tailwind CSS 4, [Base UI](https://base-ui.com) for menus, and [dnd-kit](https://dndkit.com) for drag and drop.
