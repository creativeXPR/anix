import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../shared/firebase.js'
import { uploadRoomImage } from './upload-image.js'

const PAGE_SIZE = 30
// A participant can't send more than one message this often — a basic
// client-side speed bump. Real abuse resistance needs a Firestore security
// rule / Cloud Function once the project has a backend deploy target.
const MIN_SEND_INTERVAL_MS = 1500
// A typing/presence doc older than this is treated as stale (covers a
// closed tab that never got to clear its own doc).
const TYPING_TIMEOUT_MS = 5000
const PRESENCE_TIMEOUT_MS = 45000
const PRESENCE_HEARTBEAT_MS = 20000

function messagesRef(roomId) {
  return collection(db, 'rooms', roomId, 'messages')
}

// Up to 3 rooms per account (2026-09-19 rebuild — superseded the earlier
// "one permanent room per account" model). Handle-uniqueness and the
// 3-cap need an atomic check-then-write a plain client write can't do
// safely, so creation/deletion go through Cloud Functions.
export async function createRoomHandle(handle, themeColor) {
  const call = httpsCallable(functions, 'createRoom')
  const result = await call({ handle, themeColor: themeColor || null })
  return result.data.id
}

export async function deleteRoomHandle(roomId) {
  const call = httpsCallable(functions, 'deleteRoom')
  await call({ id: roomId })
}

export function subscribeToOwnedRooms(uid, onChange) {
  const ownedQuery = query(collection(db, 'rooms'), where('ownerId', '==', uid))
  return onSnapshot(ownedQuery, (snapshot) => {
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })))
  })
}

export async function updateRoomSettings(roomId, updates) {
  await setDoc(doc(db, 'rooms', roomId), updates, { merge: true })
}

export function subscribeToRoom(roomId, onChange) {
  return onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
    onChange(snapshot.exists() ? snapshot.data() : null)
  })
}

export async function setRoomStatus(roomId, status) {
  await setDoc(doc(db, 'rooms', roomId), { status }, { merge: true })
}

function presenceDocRef(roomId, participantId) {
  return doc(db, 'rooms', roomId, 'presence', participantId)
}

// Heartbeats a presence doc while called, deletes it when told to stop.
// Returns the stop function — callers manage their own effect lifecycle.
export function startPresenceHeartbeat(roomId, participantId) {
  const ref = presenceDocRef(roomId, participantId)
  const beat = () => setDoc(ref, { updatedAt: serverTimestamp() })
  beat()
  const interval = setInterval(beat, PRESENCE_HEARTBEAT_MS)

  return () => {
    clearInterval(interval)
    deleteDoc(ref)
  }
}

export function subscribeToPresenceCount(roomId, onChange) {
  return onSnapshot(collection(db, 'rooms', roomId, 'presence'), (snapshot) => {
    const now = Date.now()
    const count = snapshot.docs.filter((docSnapshot) => {
      const updatedAt = docSnapshot.data().updatedAt?.toMillis?.()
      return updatedAt && now - updatedAt < PRESENCE_TIMEOUT_MS
    }).length
    onChange(count)
  })
}

// Subscribes to the newest page of messages, oldest-first for rendering.
// Returns an unsubscribe function.
export function subscribeToLatestMessages(roomId, onChange) {
  const latestQuery = query(
    messagesRef(roomId),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  )

  return onSnapshot(latestQuery, (snapshot) => {
    const messages = snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
      .reverse()
    onChange(messages)
  })
}

// One-time fetch of the page before `oldestMessage`, for "load older" on
// scroll-near-top. Returns oldest-first messages and whether more remain.
export async function loadOlderMessages(roomId, oldestMessage) {
  const olderQuery = query(
    messagesRef(roomId),
    orderBy('createdAt', 'desc'),
    startAfter(oldestMessage.createdAt),
    limit(PAGE_SIZE),
  )

  const snapshot = await getDocs(olderQuery)
  const messages = snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
    .reverse()

  return { messages, hasMore: snapshot.docs.length === PAGE_SIZE }
}

let lastSentAt = 0

export function canSendNow() {
  return Date.now() - lastSentAt >= MIN_SEND_INTERVAL_MS
}

export async function sendMessage({ roomId, senderId, text, replyTo, imageFile }) {
  if (!canSendNow()) return
  lastSentAt = Date.now()

  const imageUrl = imageFile ? await uploadRoomImage(roomId, imageFile) : null

  await addDoc(messagesRef(roomId), {
    text: text.trim(),
    senderId,
    imageUrl,
    // Snapshot, not a live reference — survives the original being gone,
    // and anonymous ids only make sense for the life of this room anyway.
    // Includes imageUrl so a reply to an image-only message can still
    // show a thumbnail of what's being replied to, not just blank text.
    replyTo: replyTo
      ? { id: replyTo.id, text: replyTo.text, senderId: replyTo.senderId, imageUrl: replyTo.imageUrl || null }
      : null,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(db, 'rooms', roomId),
    { lastActivityAt: serverTimestamp() },
    { merge: true },
  )
}

export async function reportMessage(roomId, messageId, reporterId) {
  await addDoc(collection(db, 'rooms', roomId, 'reports'), {
    messageId,
    reporterId,
    createdAt: serverTimestamp(),
  })
}

function typingDocRef(roomId, participantId) {
  return doc(db, 'rooms', roomId, 'typing', participantId)
}

export async function setTyping(roomId, participantId, isTyping) {
  if (isTyping) {
    await setDoc(typingDocRef(roomId, participantId), {
      updatedAt: serverTimestamp(),
    })
  } else {
    await deleteDoc(typingDocRef(roomId, participantId))
  }
}

// Aggregate only (a count, not who) — fits an anonymous room better than
// naming specific typers.
export function subscribeToTypingCount(roomId, selfParticipantId, onChange) {
  return onSnapshot(collection(db, 'rooms', roomId, 'typing'), (snapshot) => {
    const now = Date.now()
    const count = snapshot.docs.filter((docSnapshot) => {
      if (docSnapshot.id === selfParticipantId) return false
      const updatedAt = docSnapshot.data().updatedAt?.toMillis?.()
      return updatedAt && now - updatedAt < TYPING_TIMEOUT_MS
    }).length
    onChange(count)
  })
}
