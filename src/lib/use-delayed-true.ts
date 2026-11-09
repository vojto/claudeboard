import { useEffect, useState } from "react"

/*
 * Follows a boolean, but only turns true after it has stayed true for `delayMs`.
 * Turning false is instant. Used to hide the empty Inbox a moment after the last
 * card leaves, so the drop animation can finish before the columns shift.
 */
export function useDelayedTrue(value: boolean, delayMs: number) {
  const [isDelayedTrue, setIsDelayedTrue] = useState(value)

  useEffect(() => {
    if (!value) {
      setIsDelayedTrue(false)
      return
    }
    const timer = setTimeout(() => setIsDelayedTrue(true), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return value && isDelayedTrue
}
