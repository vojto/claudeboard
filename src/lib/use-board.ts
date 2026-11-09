import { useEffect, useRef, useState } from "react"
import {
  type Board,
  type LiveSession,
  mergeLiveSessions,
  moveNewlyActiveToTop,
  parseBoard,
  type SessionStatus,
} from "./board"
import { listSessions, loadBoard, saveBoard } from "./claude"

/*
 * Holds the board for the whole app. Loads it from disk once, polls Claude's
 * session files every 2 seconds, and writes the board back whenever it changes.
 * Each poll compares states with the previous poll, so a card that just became
 * busy jumps to the top of its column.
 * Returns the board (null while loading), a setter, the live sessions by id, and whether
 * the first poll has come back (before that, every session looks ended).
 */

const POLL_MS = 2000

export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null)
  const [liveSessions, setLiveSessions] = useState<Record<string, LiveSession>>({})
  const [hasPolled, setHasPolled] = useState(false)
  const previousStates = useRef<Record<string, SessionStatus> | null>(null)

  useEffect(() => {
    loadBoard().then((json) => setBoard(parseBoard(json)))
  }, [])

  const isLoaded = board !== null

  useEffect(() => {
    if (!isLoaded) return

    async function poll() {
      const sessions = await listSessions()
      const states = Object.fromEntries(sessions.map((session) => [session.id, session.status]))
      const before = previousStates.current
      previousStates.current = states

      setLiveSessions(Object.fromEntries(sessions.map((session) => [session.id, session])))
      setHasPolled(true)
      setBoard((current) => {
        if (!current) return current
        const merged = mergeLiveSessions(current, sessions)
        return before ? moveNewlyActiveToTop(merged, before, states) : merged
      })
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [isLoaded])

  const json = board && JSON.stringify(board)
  useEffect(() => {
    if (json) saveBoard(json)
  }, [json])

  return { board, setBoard, liveSessions, hasPolled }
}
