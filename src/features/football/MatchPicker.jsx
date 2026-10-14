import { useEffect, useState } from 'react'
import { kickoffLabel, matchMinute, subscribeToMatchList } from './matches.js'
import './football.css'

// Owner's room settings (football rooms): pin a match to the room's
// match card — live now, today or tomorrow. Others see only the card.
export default function MatchPicker({ value, onChange }) {
  const [matches, setMatches] = useState(null)
  useEffect(() => subscribeToMatchList(setMatches), [])

  if (matches === null) return <p className="match-picker__empty">loading matches…</p>

  const live = matches.filter((m) => m.status === 'live' || m.status === 'ht')
  const later = matches.filter((m) => m.status === 'upcoming')
  const done = matches.filter((m) => m.status === 'ft')
  const sections = [
    ['🟢 live now', live],
    ['📅 coming up', later],
    ['🏁 just finished', done],
  ].filter(([, list]) => list.length)

  return (
    <div className="match-picker">
      {value && (
        <button type="button" className="identity__clear" onClick={() => onChange(null)}>
          ✕ unpin the match
        </button>
      )}
      {sections.length === 0 && <p className="match-picker__empty">no big matches in the next day and a half 💤</p>}
      {sections.map(([title, list]) => (
        <section key={title}>
          <h4>{title}</h4>
          {list.map((m) => (
            <button
              key={m.id}
              type="button"
              className="match-picker__row"
              aria-pressed={value === m.id}
              onClick={() => onChange(value === m.id ? null : m.id)}
            >
              <span className="match-picker__teams">
                {m.home.short} <i>v</i> {m.away.short}
              </span>
              <small>
                {m.comp} ·{' '}
                {m.status === 'upcoming'
                  ? kickoffLabel(m)
                  : `${m.score.home ?? 0}–${m.score.away ?? 0} ${m.status === 'live' ? matchMinute(m) : m.status === 'ht' ? 'HT' : 'FT'}`}
              </small>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
