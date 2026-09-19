import { useEffect, useState } from 'react'
import { DESKTOP_MIN, TABLET_MIN } from '../breakpoints.js'

function getTier(width) {
  if (width >= DESKTOP_MIN) return 'desktop'
  if (width >= TABLET_MIN) return 'tablet'
  return 'mobile'
}

// Tracked in JS, not just CSS, because the component tree itself changes
// shape across these boundaries (nav orientation, chat room's settings
// panel going inline vs. overlay) — not just styling.
export function useViewportTier() {
  const [tier, setTier] = useState(() => getTier(window.innerWidth))

  useEffect(() => {
    function handleResize() {
      setTier(getTier(window.innerWidth))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return tier
}
