import type { Column } from "../lib/board"
import { MenuCheck, MenuItem, MenuSubmenu } from "../ui/menu"

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
    <MenuSubmenu label="Move to">
      {columns.map((column) => {
        const isCurrent = column.id === currentColumnId
        return (
          <MenuItem key={column.id} className="gap-2" disabled={isCurrent} onClick={() => onMove(column.id)}>
            <span className="flex-1">{column.title}</span>
            {isCurrent && <MenuCheck />}
          </MenuItem>
        )
      })}
    </MenuSubmenu>
  )
}
