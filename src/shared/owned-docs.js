import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase.js'

// Owner privacy (2026-10-14): public docs carry ownerHash =
// base64(sha256(uid + ':' + docId)) instead of the owner's uid, so nobody
// can match one person's rooms / link / private chats. Must match
// functions/index.js ownerHash and the rules' ownerHashOf().
export async function ownerHash(uid, id) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${uid}:${id}`)))
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  // URL-safe alphabet with = padding — what the rules' Bytes.toBase64() gives
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

// true / false once known, null while checking.
export function useOwnsDoc(uid, id, data) {
  const [result, setResult] = useState({ key: null, owns: null })
  const key = uid && id && data?.ownerHash ? `${uid}:${id}:${data.ownerHash}` : null
  useEffect(() => {
    if (!key) return undefined
    let live = true
    ownerHash(uid, id).then((hash) => live && setResult({ key, owns: hash === data.ownerHash }))
    return () => {
      live = false
    }
  }, [key, uid, id, data?.ownerHash])
  if (!uid || !data) return false
  if (!data.ownerHash) return false
  return result.key === key ? result.owns : null
}

// Live docs for a list of ids held in a private index doc (owners/{uid} or
// users/{uid}) — replaces the old public `where('ownerId', '==', uid)`.
// onChange gets [{ id, ...data }] (docs that don't exist are skipped).
export function subscribeToIndexedDocs(indexPath, field, collectionName, onChange) {
  const docs = new Map()
  const unsubs = new Map()
  let ids = []
  let indexLoaded = false

  const emit = () => {
    if (!indexLoaded || ids.some((id) => !docs.has(id))) return
    onChange(ids.map((id) => docs.get(id)).filter(Boolean))
  }

  const stopIndex = onSnapshot(
    doc(db, indexPath),
    (snap) => {
      indexLoaded = true
      ids = [...new Set(snap.data()?.[field] || [])]
      for (const [id, stop] of unsubs) {
        if (!ids.includes(id)) {
          stop()
          unsubs.delete(id)
          docs.delete(id)
        }
      }
      ids.forEach((id) => {
        if (unsubs.has(id)) return
        unsubs.set(
          id,
          onSnapshot(
            doc(db, collectionName, id),
            (d) => {
              docs.set(id, d.exists() ? { id: d.id, ...d.data() } : null)
              emit()
            },
            () => {
              docs.set(id, null)
              emit()
            },
          ),
        )
      })
      emit()
    },
    () => onChange([]),
  )

  return () => {
    stopIndex()
    unsubs.forEach((stop) => stop())
  }
}
