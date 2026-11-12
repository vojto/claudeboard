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
 *   It also lists sessions the Claude app adopted from somewhere else (adoptedFromOtherSurface,
 *   e.g. started by a script) that aren't archived. These often have no process left by the
 *   time the app adopts them, so they show as idle. They carry adoptedAt so the board only
 *   drops recent ones into the Inbox. Plain terminal sessions aren't adopted, so they stay out.
 *   A background session (kind "bg", e.g. started by a script) that is still running has no
 *   hostSessionId and no record in the Claude app yet. It is listed as local_<sessionId>,
 *   the same id the Claude app gives it once it adopts it, so its card stays the same.
 *   Background and adopted sessions are marked isRemote, so the board can label them.
 * - open_session: opens a session in Claude via the claude:// link. A running background
 *   session the Claude app has no record of yet is opened by its remote-control id instead
 *   (claude://code/session_…), since the app can't find it by its local id.
 * - load_board / save_board: keep the board layout as JSON in the app data folder.
 * The window-state plugin remembers the window's size and position between launches.
 */
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::sync::{LazyLock, Mutex};
use std::time::SystemTime;
use std::process::Command;
use tauri::Manager;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionFile {
    pid: i32,
    session_id: Option<String>,
    host_session_id: Option<String>,
    kind: Option<String>,
    bridge_session_id: Option<String>,
    name: Option<String>,
    cwd: Option<String>,
    status: Option<String>,
}

impl SessionFile {
    /* The id the Claude app knows this session by. None for plain terminal sessions. */
    fn board_id(&self) -> Option<String> {
        if let Some(id) = &self.host_session_id {
            return Some(id.clone());
        }
        let is_background = self.kind.as_deref() == Some("bg");
        let session_id = self.session_id.as_ref().filter(|_| is_background)?;
        Some(format!("local_{session_id}"))
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Session {
    id: String,
    name: String,
    cwd: String,
    status: String,
    adopted_at: Option<u64>,
    is_remote: bool,
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
    session_id: Option<String>,
    title: Option<String>,
    worktree_name: Option<String>,
    cwd: Option<String>,
    created_at: Option<u64>,
    is_archived: Option<bool>,
    adopted_from_other_surface: Option<bool>,
    prs: Option<Vec<PullRequest>>,
    scheduled_task_id: Option<String>,
}

#[derive(Deserialize)]
struct PullRequest {
    state: Option<String>,
}

/* The Claude app's per-org folders: claude-code-sessions/<account>/<org>/. */
fn desktop_org_dirs() -> Vec<PathBuf> {
    let home = std::env::var("HOME").unwrap_or_default();
    let base = PathBuf::from(home).join("Library/Application Support/Claude/claude-code-sessions");
    let Ok(accounts) = fs::read_dir(base) else {
        return vec![];
    };
    accounts
        .flatten()
        .filter_map(|account| fs::read_dir(account.path()).ok())
        .flat_map(|orgs| orgs.flatten())
        .map(|org| org.path())
        .collect()
}

fn desktop_session_path(host_session_id: &str) -> Option<PathBuf> {
    let file_name = format!("{host_session_id}.json");
    desktop_org_dirs()
        .into_iter()
        .map(|org| org.join(&file_name))
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

/*
 * The Claude app's records that were adopted from elsewhere, by file path. Records are read
 * again only when their file changes, since all of them together are tens of megabytes.
 */
static ADOPTED_CACHE: LazyLock<Mutex<HashMap<PathBuf, (SystemTime, Option<Session>)>>> =
    LazyLock::new(Default::default);

fn read_adopted(path: &PathBuf) -> Option<Session> {
    let text = fs::read_to_string(path).ok()?;
    if !text.contains("\"adoptedFromOtherSurface\":true") {
        return None;
    }
    let record = serde_json::from_str::<DesktopSession>(&text).ok()?;
    let is_shown = record.adopted_from_other_surface == Some(true)
        && record.is_archived != Some(true)
        && record.scheduled_task_id.is_none()
        && !is_btw(&record.title);
    if !is_shown {
        return None;
    }
    Some(Session {
        id: record.session_id?,
        name: record
            .title
            .filter(|title| !title.is_empty())
            .or(record.worktree_name)
            .unwrap_or_else(|| "Untitled".into()),
        cwd: record.cwd.unwrap_or_default(),
        status: "idle".into(),
        adopted_at: record.created_at,
        is_remote: true,
    })
}

/* Sessions the Claude app adopted from elsewhere and still shows, minus the ones in `skip`. */
fn adopted_sessions(skip: &HashSet<String>) -> Vec<Session> {
    let paths: Vec<PathBuf> = desktop_org_dirs()
        .into_iter()
        .filter_map(|org| fs::read_dir(org).ok())
        .flat_map(|files| files.flatten())
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
        .collect();

    let mut cache = ADOPTED_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache.retain(|path, _| paths.contains(path));
    paths
        .iter()
        .filter_map(|path| {
            let modified = fs::metadata(path).and_then(|meta| meta.modified()).ok()?;
            let is_fresh = cache.get(path).is_some_and(|(time, _)| *time == modified);
            if !is_fresh {
                cache.insert(path.clone(), (modified, read_adopted(path)));
            }
            let session = cache.get(path)?.1.as_ref()?;
            (!skip.contains(&session.id)).then(|| session.clone())
        })
        .collect()
}

#[tauri::command]
fn list_sessions() -> Vec<Session> {
    let mut sessions = live_sessions();
    let live_ids: HashSet<String> = sessions.iter().map(|session| session.id.clone()).collect();
    sessions.extend(adopted_sessions(&live_ids));
    sessions
}

/* The session files in ~/.claude/sessions whose process is still running. */
fn live_session_files() -> Vec<SessionFile> {
    let Ok(entries) = fs::read_dir(claude_dir().join("sessions")) else {
        return vec![];
    };

    entries
        .flatten()
        .filter(|entry| entry.path().extension().is_some_and(|ext| ext == "json"))
        .filter_map(|entry| fs::read_to_string(entry.path()).ok())
        .filter_map(|text| serde_json::from_str::<SessionFile>(&text).ok())
        .filter(|file| is_process_alive(file.pid))
        .collect()
}

fn live_sessions() -> Vec<Session> {
    live_session_files()
        .into_iter()
        .filter(|file| !is_btw(&file.name))
        .filter_map(|file| {
            let id = file.board_id()?;
            let desktop = load_desktop_session(&id);
            let is_remote = file.host_session_id.is_none()
                || desktop
                    .as_ref()
                    .is_some_and(|session| session.adopted_from_other_surface == Some(true));
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
                adopted_at: None,
                is_remote,
            })
        })
        .collect()
}

/* The remote-control id of a running session the Claude app has no record of yet. */
fn bridge_id_of_unadopted(id: &str) -> Option<String> {
    if desktop_session_path(id).is_some() {
        return None;
    }
    live_session_files()
        .into_iter()
        .find(|file| file.board_id().as_deref() == Some(id))?
        .bridge_session_id
        .filter(|bridge_id| {
            bridge_id.starts_with("session_")
                && bridge_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
        })
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

    let url = match bridge_id_of_unadopted(&id) {
        Some(bridge_id) => format!("claude://code/{bridge_id}"),
        None => format!("claude://code/continue?session={id}"),
    };
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
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            list_sessions,
            open_session,
            load_board,
            save_board
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
