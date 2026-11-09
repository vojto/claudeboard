/*
 * Backend for Claudeboard. The React board calls these commands.
 * - list_sessions: reads ~/.claude/sessions/<pid>.json and keeps only sessions whose
 *   process is still alive and that belong to the Claude desktop app (have a hostSessionId).
 * - open_session: opens a session in Claude via the claude:// link.
 * - load_board / save_board: keep the board layout as JSON in the app data folder.
 */
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionFile {
    pid: i32,
    host_session_id: Option<String>,
    name: Option<String>,
    cwd: Option<String>,
    status: Option<String>,
}

#[derive(Serialize)]
struct Session {
    id: String,
    name: String,
    cwd: String,
    status: String,
}

fn sessions_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_default();
    PathBuf::from(home).join(".claude/sessions")
}

fn is_process_alive(pid: i32) -> bool {
    unsafe { libc::kill(pid, 0) == 0 }
}

#[tauri::command]
fn list_sessions() -> Vec<Session> {
    let Ok(entries) = fs::read_dir(sessions_dir()) else {
        return vec![];
    };

    entries
        .flatten()
        .filter(|entry| entry.path().extension().is_some_and(|ext| ext == "json"))
        .filter_map(|entry| fs::read_to_string(entry.path()).ok())
        .filter_map(|text| serde_json::from_str::<SessionFile>(&text).ok())
        .filter(|file| is_process_alive(file.pid))
        .filter_map(|file| {
            Some(Session {
                id: file.host_session_id?,
                name: file.name.unwrap_or_else(|| "Untitled".into()),
                cwd: file.cwd.unwrap_or_default(),
                status: file.status.unwrap_or_else(|| "idle".into()),
            })
        })
        .collect()
}

#[tauri::command]
fn open_session(id: String) -> Result<(), String> {
    let is_valid_id = id.starts_with("local_")
        && id.len() <= 70
        && id[6..].chars().all(|c| c.is_ascii_alphanumeric() || c == '-');
    if !is_valid_id {
        return Err(format!("Not a valid session id: {id}"));
    }

    let url = format!("claude://code/continue?session={id}");
    Command::new("open").arg(url).status().map_err(|e| e.to_string())?;
    Ok(())
}

fn board_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("board.json"))
}

#[tauri::command]
fn load_board(app: tauri::AppHandle) -> Result<Option<String>, String> {
    Ok(fs::read_to_string(board_path(&app)?).ok())
}

#[tauri::command]
fn save_board(app: tauri::AppHandle, json: String) -> Result<(), String> {
    fs::write(board_path(&app)?, json).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_sessions,
            open_session,
            load_board,
            save_board
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
