import { collection, doc, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// Live match data (stage 2) — written by the footballSync Cloud Function
// into footballMatches/{id}; rooms only read. A football room's owner
// pins one (`rooms/{id}.pinnedMatch`); nothing records who pinned it.
export function subscribeToMatch(matchId, onChange) {
  return onSnapshot(
    doc(db, 'footballMatches', matchId),
    (snap) => onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => onChange(null),
  )
}

// What can be pinned: from 4h ago (still live / just finished) onward.
export function subscribeToMatchList(onChange) {
  const since = Timestamp.fromMillis(Date.now() - 4 * 60 * 60 * 1000)
  return onSnapshot(
    query(collection(db, 'footballMatches'), where('kickoff', '>=', since), orderBy('kickoff'), limit(80)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => onChange([]),
  )
}

// football-data's free tier has no match minute — estimate it from
// kickoff (with ~15 min half-time). API-Football matches carry the real one.
export function matchMinute(match, now = Date.now()) {
  if (match.status !== 'live') return null
  if (match.minute != null) return `${match.minute}′`
  const elapsed = Math.floor((now - match.kickoff.toMillis()) / 60000)
  if (elapsed <= 0) return '1′'
  if (elapsed <= 45) return `${elapsed}′`
  if (elapsed < 62) return '45+′'
  const second = elapsed - 15
  return second >= 90 ? '90+′' : `${second}′`
}

export function kickoffLabel(match) {
  const date = match.kickoff.toDate()
  const today = new Date()
  const tomorrow = new Date(Date.now() + 86_400_000)
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === today.toDateString()) return `today ${time}`
  if (date.toDateString() === tomorrow.toDateString()) return `tomorrow ${time}`
  return `${date.toLocaleDateString([], { weekday: 'short' })} ${time}`
}
