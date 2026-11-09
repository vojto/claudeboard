import { ContextMenu } from "@base-ui/react/context-menu"
import type { Column } from "../lib/board"
import { MenuItem, MenuPopup, MenuSubmenuTrigger } from "../ui/menu"

/*
 * The "Move to ▸" submenu in a card's right-click menu.
 * Lists every column. The card's own column is checked and can't be picked.
 * Picking another column moves the card to the top of it.
 */

type Props = {
  columns: Column[]
  currentColumnId: string
  onMove: (columnId: string) => void
}

export function MoveToSubmenu({ columns, currentColumnId, onMove }: Props) {
  return (
    <ContextMenu.SubmenuRoot>
      <MenuSubmenuTrigger>Move to</MenuSubmenuTrigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-50" sideOffset={4} alignOffset={-4}>
          <MenuPopup className="min-w-36">
            {columns.map((column) => {
              const isCurrent = column.id === currentColumnId
              return (
                <MenuItem key={column.id} className="gap-2" disabled={isCurrent} onClick={() => onMove(column.id)}>
                  <span className="flex-1">{column.title}</span>
                  {isCurrent && <span className="text-xs">✓</span>}
                </MenuItem>
              )
            })}
          </MenuPopup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.SubmenuRoot>
  )
}
