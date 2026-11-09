/*
 * The colors a user can give a card to tell sessions apart at a glance.
 * Tailwind classes are written out in full so Tailwind finds them when building.
 */

export const CARD_COLORS = ["red", "orange", "yellow", "green", "blue", "purple", "pink"] as const
export type CardColor = (typeof CARD_COLORS)[number]

type ColorStyle = { label: string; swatch: string; card: string }

export const COLOR_STYLES: Record<CardColor, ColorStyle> = {
  red: {
    label: "Red",
    swatch: "bg-red-500",
    card: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/60",
  },
  orange: {
    label: "Orange",
    swatch: "bg-orange-500",
    card: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/60",
  },
  yellow: {
    label: "Yellow",
    swatch: "bg-yellow-400",
    card: "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/60",
  },
  green: {
    label: "Green",
    swatch: "bg-green-500",
    card: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/60",
  },
  blue: {
    label: "Blue",
    swatch: "bg-blue-500",
    card: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60",
  },
  purple: {
    label: "Purple",
    swatch: "bg-purple-500",
    card: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/60",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-500",
    card: "border-pink-300 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/60",
  },
}

export const DEFAULT_CARD_STYLE = "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
