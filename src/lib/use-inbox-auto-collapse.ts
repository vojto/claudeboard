import { useEffect, useRef } from "react"
import { useDelayedTrue } from "./use-delayed-true"

/*
 * Collapses the Inbox when it runs out of cards, and expands it when cards show up again.
 * Collapsing waits a second after the last card leaves (and never happens mid-drag), so a
 * drop animation can finish before the columns shift. If the user expands an empty Inbox
 * by hand, it stays open until it has had cards again.
 */

const COLLAPSE_DELAY_MS = 1000

export function useInboxAutoCollapse(
  isInboxEmpty: boolean,
  isReady: boolean,
  isDragging: boolean,
  setInboxCollapsed: (isCollapsed: boolean) => void,
) {
  const hadCards = useRef(true)
  const isSettledEmpty = useDelayedTrue(isReady && isInboxEmpty && !isDragging, COLLAPSE_DELAY_MS)

  useEffect(() => {
    if (!isReady || isInboxEmpty) return
    if (!hadCards.current) setInboxCollapsed(false)
    hadCards.current = true
  }, [isReady, isInboxEmpty])

  useEffect(() => {
    if (!isSettledEmpty || !hadCards.current) return
    hadCards.current = false
    setInboxCollapsed(true)
  }, [isSettledEmpty])
}
