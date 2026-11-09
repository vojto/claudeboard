import type { CardState } from "../lib/board"

/*
 * Small dot + label showing what a session is doing right now.
 * Busy pulses amber, idle is green, waiting for you ("Needs you") is red,
 * and an idle session whose pull request got merged is purple.
 * A session that just finished and wasn't opened yet gets a solid blue "Finished" pill with a check.
 */

const STYLES: Record<Exclude<CardState, "finished">, { label: string; dot: string; text: string }> = {
  busy: { label: "Busy", dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-400" },
  idle: { label: "Idle", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  merged: { label: "Merged", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  waiting: { label: "Needs you", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
}

export function StateBadge({ state }: { state: CardState }) {
  if (state === "finished") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Finished
      </span>
    )
  }

  const style = STYLES[state]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`size-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}
