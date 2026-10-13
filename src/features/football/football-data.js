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
import { DEFAULT_BADGES } from './badges.js'

// ---- badge catalogue (code defaults + admin additions) ----

// Catalogue = DEFAULT_BADGES with Firestore `badges/{id}` merged on top.
export function useBadgeCatalog() {
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
    const byId = new Map(DEFAULT_BADGES.map((b) => [b.id, b]))
    extra.forEach((b) => byId.set(b.id, { ...byId.get(b.id), ...b }))
    return [...byId.values()]
  }, [extra])
}

export function saveBadge(badge) {
  const { id, ...data } = badge
  return setDoc(doc(db, 'badges', id), { ...data, updatedAt: serverTimestamp() })
}

export function deleteBadge(id) {
  return deleteDoc(doc(db, 'badges', id))
}

// "Can't find your club/country?" — lands in /admin → Badges.
export function requestBadge({ name, kind, where, details }) {
  return addDoc(collection(db, 'badgeRequests'), {
    name: name.trim().slice(0, 60),
    kind,
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
