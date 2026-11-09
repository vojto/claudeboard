import { ContextMenu } from "@base-ui/react/context-menu"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import { type Column, INBOX_ID } from "../lib/board"
import { ColumnContextMenu } from "./column-context-menu"
import { ColumnTitle } from "./column-title"

/*
 * One column of the board. Drag it by its header to reorder columns (the Inbox stays put).
 * Right-click anywhere on it for Collapse/Expand, Rename and Delete.
 * Collapsed, it shrinks to a narrow pill with the name and count written vertically;
 * click the pill to expand it. Collapsed columns don't take dropped cards.
 * The body is a drop zone for cards; the cards themselves are passed in as children.
 * visibleCardIds are the cards actually shown (running sessions), used for sorting and the count.
 * The Inbox gets a light blue tint so it stands apart from the user's own columns.
 */

type Props = {
  column: Column
  visibleCardIds: string[]
  isEditingTitle: boolean
  onStartEditing: () => void
  onFinishEditing: (title: string | null) => void
  onToggleCollapsed: () => void
  onDelete: () => void
  children: ReactNode
}

export function BoardColumn({
  column,
  visibleCardIds,
  isEditingTitle,
  onStartEditing,
  onFinishEditing,
  onToggleCollapsed,
  onDelete,
  children,
}: Props) {
  const isInbox = column.id === INBOX_ID
  const isCollapsed = Boolean(column.isCollapsed)
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column", isCollapsed },
    disabled: { draggable: isInbox, droppable: false },
  })

  const tint = isInbox ? "bg-blue-50 dark:bg-blue-950/40" : "bg-zinc-100 dark:bg-zinc-900"

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex max-h-full shrink-0 ${isDragging ? "opacity-40" : ""}`}
    >
      <ContextMenu.Root>
        {isCollapsed ? (
          <ContextMenu.Trigger
            onClick={onToggleCollapsed}
            className={`flex w-10 justify-center rounded-xl px-2 py-3 ${tint}`}
            {...attributes}
            {...listeners}
          >
            <div className="flex items-center gap-2 [writing-mode:vertical-rl]">
              <span className="text-sm font-semibold whitespace-nowrap text-zinc-800 dark:text-zinc-100">
                {column.title}
              </span>
              <span className="text-xs text-zinc-400">{visibleCardIds.length}</span>
            </div>
          </ContextMenu.Trigger>
        ) : (
          <ContextMenu.Trigger className={`flex max-h-full w-72 flex-col rounded-xl ${tint}`}>
            <header className="flex items-center gap-2 px-3 pt-3 pb-2" {...attributes} {...listeners}>
              <div className="min-w-0 flex-1">
                <ColumnTitle
                  title={column.title}
                  isEditing={isEditingTitle}
                  onStartEditing={onStartEditing}
                  onFinish={onFinishEditing}
                />
              </div>
              <span className="text-xs text-zinc-400">{visibleCardIds.length}</span>
            </header>

            <SortableContext items={visibleCardIds} strategy={verticalListSortingStrategy}>
              <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">{children}</div>
            </SortableContext>
          </ContextMenu.Trigger>
        )}

        <ColumnContextMenu
          isInbox={isInbox}
          isCollapsed={isCollapsed}
          onToggleCollapsed={onToggleCollapsed}
          onRename={onStartEditing}
          onDelete={onDelete}
        />
      </ContextMenu.Root>
    </section>
  )
}
