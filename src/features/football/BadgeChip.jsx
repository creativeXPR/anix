import { badgeNameColor } from './badges.js'
import './football.css'

// Windows has no flag emoji (🇳🇬 shows as the letters "NG"), so countries
// get the same two-colour dot as clubs there.
const FLAGS_OK = typeof navigator === 'undefined' || !/Windows/i.test(navigator.userAgent)

// Small pill showing a fan badge: flag emoji (countries) or a two-colour
// dot in the club's colours (clubs), then the name.
export default function BadgeChip({ badge, size = 'sm' }) {
  if (!badge) return null
  const [a, b = a] = badge.colors || []
  const flag = FLAGS_OK ? badge.emoji : null
  return (
    <span className={`badge-chip badge-chip--${size}`} style={{ '--badge': badgeNameColor(badge) || 'var(--accent)' }}>
      {flag ? (
        <span className="badge-chip__flag" aria-hidden="true">
          {flag}
        </span>
      ) : (
        <span className="badge-chip__dot" style={{ '--c1': a, '--c2': b }} aria-hidden="true" />
      )}
      {badge.name}
    </span>
  )
}
