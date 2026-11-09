import type { CardState } from "../lib/board"

/*
 * Small dot + label showing what a session is doing right now.
 * Busy pulses amber, idle is green, ended (process gone) is grey.
 */

const STYLES: Record<CardState, { label: string; dot: string; text: string }> = {
  busy: { label: "Busy", dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-400" },
  idle: { label: "Idle", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  ended: { label: "Ended", dot: "bg-zinc-400", text: "text-zinc-500" },
}

export function StateBadge({ state }: { state: CardState }) {
  const style = STYLES[state]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`size-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}
