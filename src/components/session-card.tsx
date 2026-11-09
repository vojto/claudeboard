import { ContextMenu } from "@base-ui/react/context-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { CardState, KnownSession } from "../lib/board"
import { MenuItem, MenuPopup, MenuSeparator } from "../ui/menu"
import { StateBadge } from "./state-badge"

/*
 * One Claude session on the board. Shows its title, folder and state.
 * Draggable between columns. Right-click opens a menu with Open (in Claude) and Archive.
 * Double-click also opens it. SessionCardBody is the plain look, reused for the drag overlay.
 */

type Props = {
  session: KnownSession
  state: CardState
  onOpen: () => void
  onArchive: () => void
}

export function SessionCard({ session, state, onOpen, onArchive }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: session.id,
    data: { type: "card" },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-30" : ""}
      {...attributes}
      {...listeners}
    >
      <ContextMenu.Root>
        <ContextMenu.Trigger onDoubleClick={onOpen}>
          <SessionCardBody session={session} state={state} />
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-50">
            <MenuPopup>
              <MenuItem onClick={onOpen}>Open in Claude</MenuItem>
              <MenuSeparator />
              <MenuItem onClick={onArchive}>Archive</MenuItem>
            </MenuPopup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </div>
  )
}

export function SessionCardBody({ session, state }: { session: KnownSession; state: CardState }) {
  const folder = session.cwd.split("/").filter(Boolean).pop() ?? session.cwd
  return (
    <div className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-xs select-none active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800">
      <div className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{session.name}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-zinc-500" title={session.cwd}>
          {folder}
        </span>
        <StateBadge state={state} />
      </div>
    </div>
  )
}
