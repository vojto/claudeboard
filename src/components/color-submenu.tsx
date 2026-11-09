import { ContextMenu } from "@base-ui/react/context-menu"
import { CARD_COLORS, type CardColor, COLOR_STYLES } from "../lib/colors"
import { MenuItem, MenuPopup, MenuSeparator, MenuSubmenuTrigger } from "../ui/menu"

/*
 * The "Color ▸" submenu in a card's right-click menu.
 * Lists the colors with a swatch, checks the current one, and has None to clear it.
 */

type Props = {
  color: CardColor | null
  onPick: (color: CardColor | null) => void
}

export function ColorSubmenu({ color, onPick }: Props) {
  return (
    <ContextMenu.SubmenuRoot>
      <MenuSubmenuTrigger>Color</MenuSubmenuTrigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-50" sideOffset={4} alignOffset={-4}>
          <MenuPopup className="min-w-36">
            {CARD_COLORS.map((option) => (
              <MenuItem key={option} className="gap-2" onClick={() => onPick(option)}>
                <span className={`size-3 rounded-full ${COLOR_STYLES[option].swatch}`} />
                <span className="flex-1">{COLOR_STYLES[option].label}</span>
                {color === option && <span className="text-xs">✓</span>}
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem className="gap-2" onClick={() => onPick(null)}>
              <span className="size-3 rounded-full border border-zinc-300 dark:border-zinc-600" />
              <span className="flex-1">None</span>
              {!color && <span className="text-xs">✓</span>}
            </MenuItem>
          </MenuPopup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.SubmenuRoot>
  )
}
