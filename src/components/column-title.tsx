import { useRef, useState } from "react"

/*
 * A column's name. Shows plain text, or a text field while renaming.
 * Enter or clicking away saves, Escape cancels. Empty names are ignored.
 */

type Props = {
  title: string
  isEditing: boolean
  onStartEditing: () => void
  onFinish: (title: string | null) => void
}

export function ColumnTitle({ title, isEditing, onStartEditing, onFinish }: Props) {
  if (isEditing) return <TitleInput title={title} onFinish={onFinish} />

  return (
    <h2 className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100" onDoubleClick={onStartEditing}>
      {title}
    </h2>
  )
}

function TitleInput({ title, onFinish }: { title: string; onFinish: (title: string | null) => void }) {
  const [draft, setDraft] = useState(title)
  const wasFinished = useRef(false)

  function finish(result: string | null) {
    if (wasFinished.current) return
    wasFinished.current = true
    onFinish(result)
  }

  return (
    <input
      autoFocus
      value={draft}
      onFocus={(event) => event.target.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => finish(draft.trim() || null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") finish(draft.trim() || null)
        if (event.key === "Escape") finish(null)
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="w-full min-w-0 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-sm font-semibold outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
    />
  )
}
