import type { CardState } from "../lib/board"

/*
 * Small dot + label showing what a session is doing right now.
 * Busy pulses amber, idle is green, waiting for you ("Needs you") is red,
 * and an idle session whose pull request got merged is purple.
 * A session that just finished and wasn't opened yet gets a solid blue "Finished" pill with a check.
 * Clicking that pill calls onDismiss, which turns it back into its plain state without opening the session.
 * Every badge shares one fixed-height box, so switching states never changes the card's height.
 */

const BASE = "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full text-xs font-medium"

const STYLES: Record<Exclude<CardState, "finished">, { label: string; dot: string; text: string }> = {
  busy: { label: "Busy", dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-400" },
  idle: { label: "Idle", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  merged: { label: "Merged", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  waiting: { label: "Needs you", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
}

type Props = { state: CardState; onDismiss?: () => void }

export function StateBadge({ state, onDismiss }: Props) {
  if (state === "finished") {
    return (
      <button
        type="button"
        title="Mark as seen"
        onClick={onDismiss}
        onDoubleClick={(event) => event.stopPropagation()}
        className={`${BASE} cursor-pointer bg-blue-600 px-2 text-white hover:bg-blue-700`}
      >
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Finished
      </button>
    )
  }

  const style = STYLES[state]
  return (
    <span className={`${BASE} ${style.text}`}>
      <span className={`size-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}
