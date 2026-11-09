import { Menu } from "@base-ui/react/menu"
import { MenuItem, MenuPopup } from "../ui/menu"

/*
 * The "…" button in a column header, with Rename and Delete.
 * Delete is hidden for the Inbox, which always exists.
 */

type Props = {
  isInbox: boolean
  onRename: () => void
  onDelete: () => void
}

export function ColumnMenu({ isInbox, onRename, onDelete }: Props) {
  return (
    <Menu.Root>
      <Menu.Trigger
        onPointerDown={(event) => event.stopPropagation()}
        className="rounded px-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 data-popup-open:bg-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:data-popup-open:bg-zinc-700"
      >
        •••
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50" align="end" sideOffset={4}>
          <MenuPopup>
            <MenuItem onClick={onRename}>Rename</MenuItem>
            {!isInbox && (
              <MenuItem isDestructive onClick={onDelete}>
                Delete column
              </MenuItem>
            )}
          </MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
