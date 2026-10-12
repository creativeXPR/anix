import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// Unique-visitor counting for /admin's "visitors" chart (2026-10-12).
// Each browser keeps a random id (not tied to any account) and records
// at most one `visits/{day}_{id}` doc per UTC day. The rules make the docs
// create-only and admin-readable; the chart counts them per day. No IP,
// no user agent, nothing else.
const ID_KEY = 'anix:visitor-id'
const LAST_DAY_KEY = 'anix:visit-day'

export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD, UTC
}

function visitorId() {
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    const bytes = crypto.getRandomValues(new Uint8Array(12))
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

export function logVisit() {
  try {
    if (location.pathname.startsWith('/admin')) return
    const day = dayKey()
    if (localStorage.getItem(LAST_DAY_KEY) === day) return
    const id = visitorId()
    setDoc(doc(db, 'visits', `${day}_${id}`), { day, createdAt: serverTimestamp() })
      .then(() => localStorage.setItem(LAST_DAY_KEY, day))
      // already counted today (a second write is an update → denied), or offline
      .catch(() => localStorage.setItem(LAST_DAY_KEY, day))
  } catch {
    // storage blocked (private mode etc.) — just don't count this one
  }
}
