import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/*
 * Installs the hooks that let Claudeboard show "Needs you" on a card.
 * Copies hooks/claudeboard-hook.sh to ~/.claude/claudeboard/hook.sh and adds it to
 * ~/.claude/settings.json: `set` when Claude asks a question or wants permission,
 * `clear` when the tool finishes, you send a message, or the turn ends.
 * Safe to run again: it replaces its own entries and leaves other hooks alone.
 * Run with `node scripts/install-hooks.mjs`.
 */

const claudeDir = join(homedir(), ".claude")
const hookPath = join(claudeDir, "claudeboard", "hook.sh")
const settingsPath = join(claudeDir, "settings.json")
const repoHook = join(dirname(fileURLToPath(import.meta.url)), "..", "hooks", "claudeboard-hook.sh")

const ENTRIES = [
  ["PermissionRequest", "*", "set"],
  ["Notification", "permission_prompt|elicitation_dialog", "set"],
  ["PreToolUse", "AskUserQuestion|ExitPlanMode", "set"],
  ["PostToolUse", "*", "clear"],
  ["PostToolUseFailure", "*", "clear"],
  ["UserPromptSubmit", undefined, "clear"],
  ["Stop", undefined, "clear"],
  ["SessionEnd", undefined, "clear"],
]

mkdirSync(dirname(hookPath), { recursive: true })
copyFileSync(repoHook, hookPath)
chmodSync(hookPath, 0o755)

const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {}
if (existsSync(settingsPath)) copyFileSync(settingsPath, `${settingsPath}.before-claudeboard`)
const hooks = (settings.hooks ??= {})

const isOurs = (group) => group.hooks?.some((hook) => hook.command?.includes("claudeboard/hook.sh"))
for (const event of Object.keys(hooks)) {
  hooks[event] = hooks[event].filter((group) => !isOurs(group))
}

for (const [event, matcher, action] of ENTRIES) {
  const group = { hooks: [{ type: "command", command: `sh ~/.claude/claudeboard/hook.sh ${action}` }] }
  if (matcher) group.matcher = matcher
  ;(hooks[event] ??= []).push(group)
}

writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n")
console.log(`Installed ${hookPath} and added ${ENTRIES.length} hooks to ${settingsPath}`)
