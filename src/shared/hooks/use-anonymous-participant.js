import { signInAnonymously } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useAuthUser } from '../auth-store.js'
import { getFirebaseAuth } from '../firebase.js'
import { ownerHash } from '../owned-docs.js'

// Your anonymous identity in one room (2026-10-14): a hash of your login
// (your account, or a silent anonymous session) + the room id + 'guest'.
// The rules recompute it, so nobody can post, vote or type as someone
// else; it differs per room, so you can't be followed across rooms; and
// the ':guest' salt keeps the owner's guest id different from the room's
// ownerHash (which would otherwise give the owner away).
// Returns null until ready.
export function useAnonymousParticipant(roomId) {
  const { anyUser, loading } = useAuthUser()
  const [ids, setIds] = useState({})

  useEffect(() => {
    if (loading || anyUser) return
    signInAnonymously(getFirebaseAuth()).catch((err) => console.error('guest sign-in failed', err))
  }, [loading, anyUser])

  const uid = anyUser?.uid
  const key = uid && roomId ? `${uid}:${roomId}` : null
  useEffect(() => {
    if (!key || ids[key]) return undefined
    let live = true
    ownerHash(uid, `${roomId}:guest`).then((id) => live && setIds((current) => ({ ...current, [key]: id })))
    return () => {
      live = false
    }
  }, [key, uid, roomId, ids])

  return key ? ids[key] || null : null
}

// "Guest 7KQ2XD" — a short, readable label for a guest id (older ids were
// already short).
export function guestLabel(id) {
  if (!id) return 'Guest'
  const short = id.length > 12 ? id.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() : id
  return `Guest ${short}`
}
