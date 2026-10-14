import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../../shared/firebase.js'
import { kitFor } from '../rooms/kits.js'

// ---- badge catalogue (code defaults + admin additions) ----

// Catalogue for a room type = the kit's built-in badges with Firestore
// `badges/{id}` of that type (older docs without `type` are football)
// merged on top.
export function useBadgeCatalog(type = 'football') {
  const [extra, setExtra] = useState([])
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'badges'),
        (snap) => setExtra(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => setExtra([]),
      ),
    [],
  )
  return useMemo(() => {
    const byId = new Map((kitFor(type).badges || []).map((b) => [b.id, b]))
    extra.filter((b) => (b.type || 'football') === type).forEach((b) => byId.set(b.id, { ...byId.get(b.id), ...b }))
    return [...byId.values()]
  }, [extra, type])
}

export function saveBadge(badge) {
  const { id, ...data } = badge
  return setDoc(doc(db, 'badges', id), { ...data, updatedAt: serverTimestamp() })
}

export function deleteBadge(id) {
  return deleteDoc(doc(db, 'badges', id))
}

// "Can't find your club/country?" — lands in /admin → Badges.
export function requestBadge({ name, kind, where, details, type = 'football' }) {
  return addDoc(collection(db, 'badgeRequests'), {
    name: name.trim().slice(0, 60),
    kind,
    type,
    where: where.trim().slice(0, 60),
    details: details.trim().slice(0, 300),
    createdAt: serverTimestamp(),
  })
}

// ---- your badge in a room (this browser only) ----
// Stored per room next to the anonymous participant id. Messages carry a
// snapshot of it, so there's nothing shared to look up — or to hijack.
const key = (roomId) => `anix:room:${roomId}:badge`

export function useRoomBadge(roomId) {
  const [badge, setBadgeState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key(roomId)) || 'null')
    } catch {
      return null
    }
  })
  const setBadge = (next) => {
    setBadgeState(next)
    try {
      if (next) localStorage.setItem(key(roomId), JSON.stringify(next))
      else localStorage.removeItem(key(roomId))
    } catch {
      // storage blocked — the badge just lasts this visit
    }
  }
  return [badge, setBadge]
}
