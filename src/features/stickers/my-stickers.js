import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import { db } from '../../shared/firebase.js'
import { storage } from '../../shared/firebase-storage.js'

// "My stickers" (2026-10-14): signed in → users/{uid}/stickers (follows
// you across devices); guest → this browser. When a guest signs in, their
// browser stickers move into the account (migrateGuestStickers).
const GUEST_KEY = 'anix:stickers'
const OWNER_KEY = 'anix:sticker-owner'
const MAX = 120

function readGuest() {
  try {
    const list = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeGuest(list) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // storage blocked — the sticker still sends, it just isn't kept
  }
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

// Storage folder for uploads: the account, or a random per-browser key.
function uploadOwner(uid) {
  if (uid) return uid
  try {
    let key = localStorage.getItem(OWNER_KEY)
    if (!key) {
      key = `g${newId()}`
      localStorage.setItem(OWNER_KEY, key)
    }
    return key
  } catch {
    return `g${newId()}`
  }
}

export async function uploadSticker(blob, uid) {
  const type = blob.type === 'image/png' ? 'image/png' : 'image/webp'
  const path = `anix/stickers/${uploadOwner(uid)}/${newId()}.${type === 'image/png' ? 'png' : 'webp'}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: type, cacheControl: 'public, max-age=31536000' })
  return getDownloadURL(storageRef)
}

export async function migrateGuestStickers(uid) {
  const guest = readGuest()
  if (!uid || !guest.length) return
  const batch = writeBatch(db)
  guest.slice(0, MAX).forEach((s) => batch.set(doc(db, 'users', uid, 'stickers', s.id), { ...s.sticker, createdAt: serverTimestamp() }))
  await batch.commit()
  writeGuest([])
}

// [{ id, sticker: { url } | { pack, id } }], newest first
export function useMyStickers() {
  const { user } = useAuthUser()
  const uid = user?.uid && !user.isAnonymous ? user.uid : null
  const [cloud, setCloud] = useState([])
  const [guest, setGuest] = useState(readGuest)

  useEffect(() => {
    if (!uid) return undefined
    migrateGuestStickers(uid)
      .then(() => setGuest([]))
      .catch((err) => console.error('sticker migration failed', err))
    return onSnapshot(
      query(collection(db, 'users', uid, 'stickers'), orderBy('createdAt', 'desc')),
      (snap) =>
        setCloud(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, sticker: data.url ? { url: data.url } : { pack: data.pack, id: data.id } }
          }),
        ),
      () => setCloud([]),
    )
  }, [uid])

  const stickers = uid ? cloud : guest

  async function add(sticker) {
    const key = sticker.url ? sticker.url : `${sticker.pack}:${sticker.id}`
    if (stickers.some((s) => (s.sticker.url || `${s.sticker.pack}:${s.sticker.id}`) === key)) return false
    const id = newId()
    if (uid) await setDoc(doc(db, 'users', uid, 'stickers', id), { ...sticker, createdAt: serverTimestamp() })
    else {
      const next = [{ id, sticker }, ...guest]
      writeGuest(next)
      setGuest(next)
    }
    return true
  }

  async function remove(id) {
    if (uid) await deleteDoc(doc(db, 'users', uid, 'stickers', id))
    else {
      const next = guest.filter((s) => s.id !== id)
      writeGuest(next)
      setGuest(next)
    }
  }

  return { stickers, add, remove, uid }
}
