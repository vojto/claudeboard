import type { Board, Column, LiveSession } from "./board"

export type Project = { path: string; label: string; count: number }

export const PROJECT_CHIP_LIMIT = 5

export function projectPath(cwd: string): string {
  const path = cwd.split("/.claude/worktrees/")[0]
  return path.replace(/\/+$/, "") || (path.startsWith("/") ? "/" : "")
}

export function projectName(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? (path || "Unknown project")
}

export function visibleCardIds(board: Board, column: Column, live: Record<string, LiveSession>): string[] {
  const archived = new Set(board.archivedIds)
  const selected = board.selectedProjectPaths && new Set(board.selectedProjectPaths)
  return column.cardIds.filter((id) => {
    const session = live[id]
    return session && !archived.has(id) && (!selected || selected.has(projectPath(session.cwd)))
  })
}

export function listProjects(board: Board, live: Record<string, LiveSession>): Project[] {
  const counts = new Map<string, number>((board.selectedProjectPaths ?? []).map((path) => [path, 0]))
  const archived = new Set(board.archivedIds)
  const placed = new Set(board.columns.flatMap((column) => column.cardIds))
  for (const id of placed) {
    const session = live[id]
    if (!session || archived.has(id)) continue
    const path = projectPath(session.cwd)
    counts.set(path, (counts.get(path) ?? 0) + 1)
  }
  const names = [...counts.keys()].map(projectName)
  return [...counts]
    .map(([path, count]) => {
      const name = projectName(path)
      const duplicate = names.filter((item) => item === name).length > 1
      return { path, count, label: duplicate && path ? `${name} — ${path}` : name }
    })
    .sort((a, b) => a.label.localeCompare(b.label) || a.path.localeCompare(b.path))
}
