import { Menu } from "@base-ui/react/menu"
import type { ComponentProps } from "react"

/*
 * Shared look for every menu in the app (right-click menus and "…" menus).
 * Wraps base-ui's Menu.Popup, Menu.Item, Menu.SubmenuTrigger and Menu.Separator with Tailwind styles.
 * These parts work inside both <Menu.Root> and <ContextMenu.Root>.
 */

export function MenuPopup({ className = "", ...props }: ComponentProps<typeof Menu.Popup>) {
  return (
    <Menu.Popup
      className={`min-w-44 rounded-lg border border-zinc-200 bg-white p-1 text-sm shadow-lg outline-none dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
      {...props}
    />
  )
}

export function MenuItem({
  isDestructive = false,
  className = "",
  ...props
}: ComponentProps<typeof Menu.Item> & { isDestructive?: boolean }) {
  const color = isDestructive
    ? "text-red-600 data-highlighted:bg-red-50 dark:text-red-400 dark:data-highlighted:bg-red-950"
    : "text-zinc-800 data-highlighted:bg-zinc-100 dark:text-zinc-100 dark:data-highlighted:bg-zinc-700"
  return (
    <Menu.Item
      className={`flex cursor-default items-center rounded-md px-2.5 py-1.5 outline-none select-none data-disabled:opacity-50 ${color} ${className}`}
      {...props}
    />
  )
}

export function MenuSubmenuTrigger({ children, ...props }: ComponentProps<typeof Menu.SubmenuTrigger>) {
  return (
    <Menu.SubmenuTrigger
      className="flex cursor-default items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-zinc-800 outline-none select-none data-highlighted:bg-zinc-100 data-popup-open:bg-zinc-100 dark:text-zinc-100 dark:data-highlighted:bg-zinc-700 dark:data-popup-open:bg-zinc-700"
      {...props}
    >
      {children}
      <span className="text-xs text-zinc-400">▸</span>
    </Menu.SubmenuTrigger>
  )
}

export function MenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />
}
