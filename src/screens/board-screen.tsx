import {
  closestCenter,
  closestCorners,
  type CollisionDetection,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import { useState } from "react"
import { BoardColumn } from "../components/board-column"
import { SessionCard, SessionCardBody } from "../components/session-card"
import * as boards from "../lib/board"
import type { Board } from "../lib/board"
import { openSession } from "../lib/claude"
import { useBoard } from "../lib/use-board"

/*
 * The only screen: the kanban board of Claude sessions.
 * Owns drag and drop. Cards move between columns live while dragging (onDragOver)
 * and settle on drop (onDragEnd). Columns reorder by dragging their header.
 * Also handles adding, renaming and deleting columns, and archiving cards.
 * Only running sessions are shown; ended ones keep their spot but stay hidden.
 * The Inbox column hides when it has no cards.
 */

/* While dragging a column, only look at other columns. While dragging a card, look at everything. */
const collisionDetection: CollisionDetection = (args) => {
  if (args.active.data.current?.type === "column") {
    const columns = args.droppableContainers.filter((container) => container.data.current?.type === "column")
    return closestCenter({ ...args, droppableContainers: columns })
  }
  return closestCorners(args)
}

/* On drop, ease the dragged card's tilt back to 0° while it slides home, so it doesn't snap upright at the end. */
const hideSourceWhileDropping = defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } })
const dropAnimation: DropAnimation = {
  sideEffects: (params) => {
    params.dragOverlay.node
      .querySelector("[data-tilt]")
      ?.animate([{ rotate: "0deg" }], { duration: 250, easing: "ease", fill: "forwards" })
    return hideSourceWhileDropping(params)
  },
}

export function BoardScreen() {
  const { board, setBoard, liveSessions } = useBoard()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!board) return null

  function update(change: (board: Board) => Board) {
    setBoard((current) => current && change(current))
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.data.current?.type !== "card") return
    const cardId = String(active.id)
    const overId = String(over.id)

    update((current) => {
      const fromColumnId = boards.findColumnId(current, cardId)
      const toColumnId = boards.findColumnId(current, overId)
      if (!toColumnId || fromColumnId === toColumnId) return current
      const beforeId = over.data.current?.type === "card" ? overId : undefined
      return boards.moveCard(current, cardId, toColumnId, beforeId)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const activeKey = String(active.id)
    const overKey = String(over.id)

    if (active.data.current?.type === "column") {
      update((current) => boards.moveColumn(current, activeKey, overKey))
      return
    }

    update((current) => {
      const toColumnId = boards.findColumnId(current, overKey)
      if (!toColumnId || over.data.current?.type !== "card") return current
      const column = current.columns.find((column) => column.id === toColumnId)!
      const isMovingDown = column.cardIds.indexOf(activeKey) < column.cardIds.indexOf(overKey)
      const beforeId = isMovingDown ? column.cardIds[column.cardIds.indexOf(overKey) + 1] : overKey
      return boards.moveCard(current, activeKey, toColumnId, beforeId)
    })
  }

  function handleAddColumn() {
    const id = `col_${crypto.randomUUID()}`
    update((current) => boards.addColumn(current, id, "New column"))
    setEditingColumnId(id)
  }

  function handleFinishEditing(columnId: string, title: string | null) {
    setEditingColumnId(null)
    if (title) update((current) => boards.renameColumn(current, columnId, title))
  }

  /* Only running sessions are shown. An empty Inbox hides, except mid-drag so you can drop into it. */
  const shownColumns = board.columns
    .map((column) => ({ column, visibleCardIds: column.cardIds.filter((id) => liveSessions[id]) }))
    .filter(({ column, visibleCardIds }) => column.id !== boards.INBOX_ID || visibleCardIds.length > 0 || activeId)

  const activeColumn = board.columns.find((column) => column.id === activeId)
  const activeSession = activeId ? board.sessions[activeId] : undefined

  return (
    <main className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto p-4">
          <SortableContext items={shownColumns.map(({ column }) => column.id)} strategy={horizontalListSortingStrategy}>
            {shownColumns.map(({ column, visibleCardIds }) => {
              return (
                <BoardColumn
                  key={column.id}
                  column={column}
                  visibleCardIds={visibleCardIds}
                  isEditingTitle={editingColumnId === column.id}
                  onStartEditing={() => setEditingColumnId(column.id)}
                  onFinishEditing={(title) => handleFinishEditing(column.id, title)}
                  onDelete={() => update((current) => boards.deleteColumn(current, column.id))}
                >
                  {visibleCardIds.map((id) => (
                    <SessionCard
                      key={id}
                      session={board.sessions[id] ?? liveSessions[id]}
                      state={liveSessions[id].status}
                      color={board.colors[id] ?? null}
                      onOpen={() => openSession(id)}
                      onPickColor={(color) => update((current) => boards.setCardColor(current, id, color))}
                      onArchive={() => update((current) => boards.archiveCard(current, id))}
                    />
                  ))}
                </BoardColumn>
              )
            })}
          </SortableContext>

          <button
            onClick={handleAddColumn}
            className="w-72 shrink-0 rounded-xl border border-dashed border-zinc-300 p-3 text-left text-sm text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            + Add column
          </button>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeSession && (
            <div data-tilt className="rotate-2">
              <SessionCardBody
                session={activeSession}
                state={liveSessions[activeSession.id]?.status ?? "idle"}
                color={board.colors[activeSession.id] ?? null}
              />
            </div>
          )}
          {activeColumn && (
            <div className="w-72 rounded-xl bg-zinc-100 px-3 py-3 text-sm font-semibold opacity-90 shadow-lg dark:bg-zinc-900 dark:text-zinc-100">
              {activeColumn.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </main>
  )
}
