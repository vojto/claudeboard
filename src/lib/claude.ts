import { invoke } from "@tauri-apps/api/core"
import type { LiveSession } from "./board"

/*
 * Thin wrappers around the Rust commands in src-tauri/src/lib.rs.
 * Reading sessions, opening them in Claude, and saving the board all go through here.
 */

export function listSessions() {
  return invoke<LiveSession[]>("list_sessions")
}

export function openSession(id: string) {
  return invoke("open_session", { id })
}

export function loadBoard() {
  return invoke<string | null>("load_board")
}

export function saveBoard(json: string) {
  return invoke("save_board", { json })
}
