import { useEffect, useRef } from 'react'
import { playPop } from '../sounds.js'

// Pops when items appear that weren't there before — never for what's
// already on screen when the data first loads (`ready`), and only for
// items `isIncoming` accepts (e.g. not your own messages).
export function usePopOnNew(items, { ready = true, isIncoming = () => true, key = (item) => item.id } = {}) {
  const seen = useRef(null)

  useEffect(() => {
    if (!ready) return
    const ids = items.map(key)
    if (seen.current === null) {
      seen.current = new Set(ids)
      return
    }
    const fresh = items.filter((item) => !seen.current.has(key(item)))
    ids.forEach((id) => seen.current.add(id))
    if (fresh.some(isIncoming)) playPop()
  }, [items, ready, isIncoming, key])
}

// Pops when a count goes up after it has first loaded (unread badges).
export function usePopOnIncrease(count, ready) {
  const previous = useRef(null)

  useEffect(() => {
    if (!ready) return
    if (previous.current !== null && count > previous.current) playPop()
    previous.current = count
  }, [count, ready])
}
