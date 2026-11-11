import { ContextMenu } from "@base-ui/react/context-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { CardState, Column, KnownSession } from "../lib/board"
import { type CardColor, COLOR_STYLES, DEFAULT_CARD_STYLE } from "../lib/colors"
import { projectName, projectPath } from "../lib/projects"
import { MenuItem, MenuPopup, MenuSeparator } from "../ui/menu"
import { ColorSubmenu } from "./color-submenu"
import { MoveToSubmenu } from "./move-to-submenu"
import { StateBadge } from "./state-badge"

/*
 * One Claude session on the board. Shows its title, project and state.
 * For worktree sessions (…/project/.claude/worktrees/branch) the project is the main folder's name.
 * Draggable between columns. Right-click opens a menu with Open (in Claude), Move to, Color and Archive.
 * A picked color tints the card. Right-clicks stop here so the column's menu doesn't open too.
 * Clicking the title text or double-clicking the card also opens it. Clicking a Finished badge just clears it. SessionCardBody is the plain look, reused for the drag overlay.
 */

type Props = {
  session: KnownSession
  state: CardState
  color: CardColor | null
  columns: Column[]
  columnId: string
  onOpen: () => void
  onDismissFinished: () => void
  onMoveTo: (columnId: string) => void
  onPickColor: (color: CardColor | null) => void
  onArchive: () => void
}

export function SessionCard({
  session,
  state,
  color,
  columns,
  columnId,
  onOpen,
  onDismissFinished,
  onMoveTo,
  onPickColor,
  onArchive,
}: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: session.id,
    data: { type: "card" },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-30" : ""}
      onContextMenu={(event) => event.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <ContextMenu.Root>
        <ContextMenu.Trigger onDoubleClick={onOpen}>
          <SessionCardBody
            session={session}
            state={state}
            color={color}
            onOpen={onOpen}
            onDismissFinished={onDismissFinished}
          />
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-50">
            <MenuPopup>
              <MenuItem onClick={onOpen}>Open in Claude</MenuItem>
              <MoveToSubmenu columns={columns} currentColumnId={columnId} onMove={onMoveTo} />
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

type BodyProps = {
  session: KnownSession
  state: CardState
  color: CardColor | null
  onOpen?: () => void
  onDismissFinished?: () => void
}

export function SessionCardBody({ session, state, color, onOpen, onDismissFinished }: BodyProps) {
  const project = projectName(projectPath(session.cwd))
  return (
    <div
      className={`rounded-lg border p-3 shadow-xs select-none ${color ? COLOR_STYLES[color].card : DEFAULT_CARD_STYLE}`}
    >
      <div className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <span onClick={onOpen} className="cursor-pointer hover:underline">
          {session.name}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-zinc-500" title={session.cwd}>
          {project}
        </span>
        <StateBadge state={state} onDismiss={onDismissFinished} />
      </div>
    </div>
  )
}
