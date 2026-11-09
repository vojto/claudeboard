import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import { type Column, INBOX_ID } from "../lib/board"
import { ColumnMenu } from "./column-menu"
import { ColumnTitle } from "./column-title"

/*
 * One column of the board. Drag it by its header to reorder columns (the Inbox stays put).
 * The body is a drop zone for cards; the cards themselves are passed in as children.
 */

type Props = {
  column: Column
  isEditingTitle: boolean
  onStartEditing: () => void
  onFinishEditing: (title: string | null) => void
  onDelete: () => void
  children: ReactNode
}

export function BoardColumn({ column, isEditingTitle, onStartEditing, onFinishEditing, onDelete, children }: Props) {
  const isInbox = column.id === INBOX_ID
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: { draggable: isInbox, droppable: false },
  })

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-zinc-100 dark:bg-zinc-900 ${isDragging ? "opacity-40" : ""}`}
    >
      <header
        className={`flex items-center gap-2 px-3 pt-3 pb-2 ${isInbox ? "" : "cursor-grab active:cursor-grabbing"}`}
        {...attributes}
        {...listeners}
      >
        <div className="min-w-0 flex-1">
          <ColumnTitle
            title={column.title}
            isEditing={isEditingTitle}
            onStartEditing={onStartEditing}
            onFinish={onFinishEditing}
          />
        </div>
        <span className="text-xs text-zinc-400">{column.cardIds.length}</span>
        <ColumnMenu isInbox={isInbox} onRename={onStartEditing} onDelete={onDelete} />
      </header>

      <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">{children}</div>
      </SortableContext>
    </section>
  )
}
