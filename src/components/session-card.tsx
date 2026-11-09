import { ContextMenu } from "@base-ui/react/context-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { KnownSession, SessionStatus } from "../lib/board"
import { type CardColor, COLOR_STYLES, DEFAULT_CARD_STYLE } from "../lib/colors"
import { MenuItem, MenuPopup, MenuSeparator } from "../ui/menu"
import { ColorSubmenu } from "./color-submenu"
import { StateBadge } from "./state-badge"

/*
 * One Claude session on the board. Shows its title, project and state.
 * For worktree sessions (…/project/.claude/worktrees/branch) the project is the main folder's name.
 * Draggable between columns. Right-click opens a menu with Open (in Claude), Color and Archive.
 * A picked color tints the card.
 * Double-click also opens it. SessionCardBody is the plain look, reused for the drag overlay.
 */

type Props = {
  session: KnownSession
  state: SessionStatus
  color: CardColor | null
  onOpen: () => void
  onPickColor: (color: CardColor | null) => void
  onArchive: () => void
}

export function SessionCard({ session, state, color, onOpen, onPickColor, onArchive }: Props) {
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
          <SessionCardBody session={session} state={state} color={color} />
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-50">
            <MenuPopup>
              <MenuItem onClick={onOpen}>Open in Claude</MenuItem>
              <ColorSubmenu color={color} onPick={onPickColor} />
              <MenuSeparator />
              <MenuItem onClick={onArchive}>Archive</MenuItem>
            </MenuPopup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </div>
  )
}

type BodyProps = { session: KnownSession; state: SessionStatus; color: CardColor | null }

export function SessionCardBody({ session, state, color }: BodyProps) {
  const projectPath = session.cwd.split("/.claude/worktrees/")[0]
  const project = projectPath.split("/").filter(Boolean).pop() ?? projectPath
  return (
    <div
      className={`cursor-grab rounded-lg border p-3 shadow-xs select-none active:cursor-grabbing ${color ? COLOR_STYLES[color].card : DEFAULT_CARD_STYLE}`}
    >
      <div className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{session.name}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-zinc-500" title={session.cwd}>
          {project}
        </span>
        <StateBadge state={state} />
      </div>
    </div>
  )
}
