import { useEffect, useState } from 'react'
import { kickoffLabel, matchMinute, subscribeToMatch } from './matches.js'
import './football.css'

// Pinned match strip at the top of a football room: teams, score, status
// (LIVE + minute / HT / FT / kickoff time). Updates live from the
// footballSync function; the minute ticks locally between updates.
export default function MatchCard({ matchId }) {
  const [match, setMatch] = useState(undefined)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => subscribeToMatch(matchId, setMatch), [matchId])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (!match) return null

  const started = match.status === 'live' || match.status === 'ht' || match.status === 'ft'
  const status =
    match.status === 'live'
      ? matchMinute(match, now)
      : match.status === 'ht'
        ? 'HT'
        : match.status === 'ft'
          ? 'FT'
          : match.status === 'off'
            ? 'postponed'
            : kickoffLabel(match)

  return (
    <div className={`match-card match-card--${match.status} pop-in`} aria-label={`${match.home.short} versus ${match.away.short}`}>
      <span className="match-card__comp">{match.comp}</span>
      <div className="match-card__row">
        <span className="match-card__team">{match.home.short}</span>
        <span className="match-card__score">
          {started ? (
            <>
              {match.score.home ?? 0}
              <i>–</i>
              {match.score.away ?? 0}
            </>
          ) : (
            'v'
          )}
        </span>
        <span className="match-card__team match-card__team--away">{match.away.short}</span>
      </div>
      <span className="match-card__status">
        {match.status === 'live' && <span className="match-card__dot" aria-hidden="true" />}
        {match.status === 'live' ? `LIVE ${status}` : status}
        {match.source === 'fd' && match.status === 'live' && <small> · may lag a few min</small>}
      </span>
    </div>
  )
}
