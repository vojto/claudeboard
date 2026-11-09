/*
 * Backend for Claudeboard. The React board calls these commands.
 * - list_sessions: reads ~/.claude/sessions/<pid>.json and keeps only sessions whose
 *   process is still alive and that belong to the Claude desktop app (have a hostSessionId).
 *   A session is "waiting" when the Claudeboard hook left a mark for it in
 *   ~/.claude/claudeboard/waiting/<sessionId> (see hooks/claudeboard-hook.sh).
 *   An idle session is "merged" when the Claude app's own record of it
 *   (~/Library/Application Support/Claude/claude-code-sessions/<account>/<org>/<hostSessionId>.json)
 *   lists a merged pull request and none that are still open.
 *   Sessions named "btw…" (side questions) and sessions started by a scheduled task
 *   (the Claude app's record has a scheduledTaskId) are left out.
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
    session_id: Option<String>,
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

fn claude_dir() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap_or_default()).join(".claude")
}

fn is_waiting(session_id: &Option<String>) -> bool {
    session_id
        .as_ref()
        .is_some_and(|id| claude_dir().join("claudeboard/waiting").join(id).exists())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopSession {
    prs: Option<Vec<PullRequest>>,
    scheduled_task_id: Option<String>,
}

#[derive(Deserialize)]
struct PullRequest {
    state: Option<String>,
}

fn desktop_session_path(host_session_id: &str) -> Option<PathBuf> {
    let home = std::env::var("HOME").unwrap_or_default();
    let base = PathBuf::from(home).join("Library/Application Support/Claude/claude-code-sessions");
    let file_name = format!("{host_session_id}.json");
    fs::read_dir(base)
        .ok()?
        .flatten()
        .filter_map(|account| fs::read_dir(account.path()).ok())
        .flat_map(|orgs| orgs.flatten())
        .map(|org| org.path().join(&file_name))
        .find(|path| path.exists())
}

fn load_desktop_session(host_session_id: &str) -> Option<DesktopSession> {
    let text = fs::read_to_string(desktop_session_path(host_session_id)?).ok()?;
    serde_json::from_str(&text).ok()
}

fn is_pr_merged(session: Option<DesktopSession>) -> bool {
    let Some(session) = session else {
        return false;
    };
    let states: Vec<String> = session
        .prs
        .unwrap_or_default()
        .into_iter()
        .filter_map(|pr| pr.state)
        .collect();
    states.iter().any(|state| state == "MERGED") && !states.iter().any(|state| state == "OPEN")
}

fn is_process_alive(pid: i32) -> bool {
    unsafe { libc::kill(pid, 0) == 0 }
}

/* Side questions asked with /btw get their own short sessions. They don't belong on the board. */
fn is_btw(name: &Option<String>) -> bool {
    name.as_ref()
        .is_some_and(|name| name.to_lowercase().starts_with("btw"))
}

#[tauri::command]
fn list_sessions() -> Vec<Session> {
    let Ok(entries) = fs::read_dir(claude_dir().join("sessions")) else {
        return vec![];
    };

    entries
        .flatten()
        .filter(|entry| entry.path().extension().is_some_and(|ext| ext == "json"))
        .filter_map(|entry| fs::read_to_string(entry.path()).ok())
        .filter_map(|text| serde_json::from_str::<SessionFile>(&text).ok())
        .filter(|file| is_process_alive(file.pid))
        .filter(|file| !is_btw(&file.name))
        .filter_map(|file| {
            let id = file.host_session_id?;
            let desktop = load_desktop_session(&id);
            if desktop
                .as_ref()
                .is_some_and(|session| session.scheduled_task_id.is_some())
            {
                return None;
            }
            let status = file.status.unwrap_or_else(|| "idle".into());
            let status = if is_waiting(&file.session_id) {
                "waiting".into()
            } else if status == "idle" && is_pr_merged(desktop) {
                "merged".into()
            } else {
                status
            };
            Some(Session {
                id,
                name: file.name.unwrap_or_else(|| "Untitled".into()),
                cwd: file.cwd.unwrap_or_default(),
                status,
            })
        })
        .collect()
}

#[tauri::command]
fn open_session(id: String) -> Result<(), String> {
    let is_valid_id = id.starts_with("local_")
        && id.len() <= 70
        && id[6..]
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-');
    if !is_valid_id {
        return Err(format!("Not a valid session id: {id}"));
    }

    let url = format!("claude://code/continue?session={id}");
    Command::new("open")
        .arg(url)
        .status()
        .map_err(|e| e.to_string())?;
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
