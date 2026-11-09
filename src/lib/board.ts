/*
 * The board's data model and the pure functions that change it.
 * A board is a list of columns, each holding session ids in order. The board also
 * remembers every session it has seen (name, folder) so cards survive after the
 * session's process exits, and which sessions the user archived (hidden for good).
 */

export const INBOX_ID = "inbox"

export type SessionStatus = "busy" | "idle"
export type CardState = SessionStatus | "ended"

export type KnownSession = { id: string; name: string; cwd: string }
export type LiveSession = KnownSession & { status: SessionStatus }

export type Column = { id: string; title: string; cardIds: string[] }

export type Board = {
  columns: Column[]
  sessions: Record<string, KnownSession>
  archivedIds: string[]
}

export function emptyBoard(): Board {
  return {
    columns: [{ id: INBOX_ID, title: "Inbox", cardIds: [] }],
    sessions: {},
    archivedIds: [],
  }
}

export function parseBoard(json: string | null): Board {
  if (!json) return emptyBoard()
  try {
    return JSON.parse(json) as Board
  } catch {
    return emptyBoard()
  }
}

/* Folds the current live sessions into the board: refreshes names, drops new ones into the Inbox. */
export function mergeLiveSessions(board: Board, live: LiveSession[]): Board {
  const placedIds = new Set(board.columns.flatMap((column) => column.cardIds))
  const archivedIds = new Set(board.archivedIds)
  const sessions = { ...board.sessions }
  const newIds: string[] = []

  for (const { id, name, cwd } of live) {
    sessions[id] = { id, name, cwd }
    if (!placedIds.has(id) && !archivedIds.has(id)) newIds.push(id)
  }

  const columns = board.columns.map((column) =>
    column.id === INBOX_ID ? { ...column, cardIds: [...newIds, ...column.cardIds] } : column,
  )
  return { ...board, sessions, columns }
}

/*
 * Moves cards whose state just changed, within their own column:
 * became busy → top, became ended → bottom. Other changes keep the user's order.
 */
export function reorderByStateChanges(
  board: Board,
  before: Record<string, CardState>,
  after: Record<string, CardState>,
): Board {
  const columns = board.columns.map((column) => {
    const becameBusy: string[] = []
    const becameEnded: string[] = []
    const rest: string[] = []

    for (const id of column.cardIds) {
      const was = before[id] ?? "ended"
      const now = after[id] ?? "ended"
      if (was !== now && now === "busy") becameBusy.push(id)
      else if (was !== now && now === "ended") becameEnded.push(id)
      else rest.push(id)
    }
    return { ...column, cardIds: [...becameBusy, ...rest, ...becameEnded] }
  })
  return { ...board, columns }
}

export function findColumnId(board: Board, id: string): string | undefined {
  if (board.columns.some((column) => column.id === id)) return id
  return board.columns.find((column) => column.cardIds.includes(id))?.id
}

export function addColumn(board: Board, id: string, title: string): Board {
  return { ...board, columns: [...board.columns, { id, title, cardIds: [] }] }
}

export function renameColumn(board: Board, columnId: string, title: string): Board {
  return {
    ...board,
    columns: board.columns.map((column) => (column.id === columnId ? { ...column, title } : column)),
  }
}

/* Deletes a column. Its cards go back to the Inbox so nothing gets lost. */
export function deleteColumn(board: Board, columnId: string): Board {
  if (columnId === INBOX_ID) return board
  const deleted = board.columns.find((column) => column.id === columnId)
  if (!deleted) return board

  const columns = board.columns
    .filter((column) => column.id !== columnId)
    .map((column) =>
      column.id === INBOX_ID ? { ...column, cardIds: [...column.cardIds, ...deleted.cardIds] } : column,
    )
  return { ...board, columns }
}

export function archiveCard(board: Board, cardId: string): Board {
  return {
    ...board,
    archivedIds: [...board.archivedIds, cardId],
    columns: board.columns.map((column) => ({
      ...column,
      cardIds: column.cardIds.filter((id) => id !== cardId),
    })),
  }
}

/* Moves a card into a column, placed before `beforeId` (or at the end when it's missing). */
export function moveCard(board: Board, cardId: string, toColumnId: string, beforeId?: string): Board {
  const columns = board.columns.map((column) => {
    const cardIds = column.cardIds.filter((id) => id !== cardId)
    if (column.id !== toColumnId) return { ...column, cardIds }

    const index = beforeId ? cardIds.indexOf(beforeId) : -1
    cardIds.splice(index === -1 ? cardIds.length : index, 0, cardId)
    return { ...column, cardIds }
  })
  return { ...board, columns }
}

/* Moves a column to where `overId` is. The Inbox always stays first. */
export function moveColumn(board: Board, columnId: string, overId: string): Board {
  if (columnId === INBOX_ID || overId === INBOX_ID) return board
  const from = board.columns.findIndex((column) => column.id === columnId)
  const to = board.columns.findIndex((column) => column.id === overId)
  if (from === -1 || to === -1 || from === to) return board

  const columns = [...board.columns]
  const [moved] = columns.splice(from, 1)
  columns.splice(to, 0, moved)
  return { ...board, columns }
}
