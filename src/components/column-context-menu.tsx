import { ContextMenu } from "@base-ui/react/context-menu"
import { MenuItem, MenuPopup, MenuSeparator } from "../ui/menu"

/*
 * The right-click menu for a column (open or collapsed): Collapse/Expand, Rename, Delete.
 * Delete is hidden for the Inbox, which always exists.
 */

type Props = {
  isInbox: boolean
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onRename: () => void
  onDelete: () => void
}

export function ColumnContextMenu({ isInbox, isCollapsed, onToggleCollapsed, onRename, onDelete }: Props) {
  return (
    <ContextMenu.Portal>
      <ContextMenu.Positioner className="z-50">
        <MenuPopup>
          <MenuItem onClick={onToggleCollapsed}>{isCollapsed ? "Expand" : "Collapse"}</MenuItem>
          <MenuItem onClick={onRename}>Rename</MenuItem>
          {!isInbox && (
            <>
              <MenuSeparator />
              <MenuItem isDestructive onClick={onDelete}>
                Delete column
              </MenuItem>
            </>
          )}
        </MenuPopup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  )
}
