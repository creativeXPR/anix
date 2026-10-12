import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../shared/firebase.js'

// Anonymous two-way reply (phase 2, 2026-10-12).
//
// Capability model: when someone sends an anonymous message, THEIR browser
// generates a long random `threadId` and stores it on the message (and in
// their own localStorage). The thread itself, `threads/{threadId}`, only
// comes into existence when the link owner taps "reply privately". After
// that, knowing the id is what lets the sender in — there is no sender
// account. Owner side is a normal signed-in owner check (see rules).
//
// Senders also get a per-link random `senderKey` (localStorage) stamped on
// every message, so the owner can block that browser from the link. It's
// never shown in the UI.

const THREAD_ID_LENGTH = 24
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// Cryptographically random (≈143 bits) — this id is the only lock on a
// thread, unlike the short human-readable ids used elsewhere.
export function secureId(length = THREAD_ID_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

// ---------- the sender's own browser ----------

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode / storage blocked — the private link still works.
  }
}

export function getSenderKey(endpointId) {
  const key = `anix:sender:${endpointId}`
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const created = secureId(20)
    localStorage.setItem(key, created)
    return created
  } catch {
    return secureId(20) // not persisted: blocking just can't follow this browser
  }
}

// Threads this browser could open on a link (newest first):
// [{ threadId, endpointId, handle, text, game, prompt, sentAt }].
export function getMyThreads(endpointId) {
  return readJson(`anix:threads:${endpointId}`, [])
}

// Also indexed by id, so /t/:threadId can show "your message" before the
// owner has opened the thread (the thread doc doesn't exist yet then).
export function rememberMyThread(entry) {
  const list = getMyThreads(entry.endpointId).filter((item) => item.threadId !== entry.threadId)
  writeJson(`anix:threads:${entry.endpointId}`, [entry, ...list].slice(0, 50))
  writeJson(`anix:thread:${entry.threadId}`, entry)
}

export function getRememberedThread(threadId) {
  return readJson(`anix:thread:${threadId}`, null)
}

export function threadLink(threadId) {
  return `${window.location.origin}/t/${threadId}`
}

// ---------- threads ----------

function threadRef(threadId) {
  return doc(db, 'threads', threadId)
}

export function subscribeToThread(threadId, onChange, onError) {
  return onSnapshot(
    threadRef(threadId),
    (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  )
}

export function subscribeToThreadMessages(threadId, onChange) {
  const messagesQuery = query(collection(db, 'threads', threadId, 'messages'), orderBy('createdAt', 'asc'), limit(300))
  return onSnapshot(messagesQuery, (snapshot) =>
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  )
}

// Every thread the signed-in owner has opened. No orderBy (that would need
// a composite index) — callers sort by lastActivityAt client-side.
export function subscribeToOwnedThreads(uid, onChange) {
  const ownedQuery = query(collection(db, 'threads'), where('ownerId', '==', uid))
  return onSnapshot(ownedQuery, (snapshot) =>
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  )
}

// Owner taps "reply privately": create the thread at the id the sender's
// browser chose (rules check it matches the message). Idempotent.
export async function openThread({ endpoint, message, ownerId }) {
  const ref = threadRef(message.threadId)
  const existing = await getDoc(ref)
  if (existing.exists()) return message.threadId
  await setDoc(ref, {
    ownerId,
    endpointId: endpoint.id,
    messageId: message.id,
    handle: endpoint.handle,
    themeColor: endpoint.themeColor || null,
    message: { text: message.text, game: message.game || null, prompt: message.prompt || null },
    senderKey: message.senderKey || null,
    status: 'open',
    ownerUnread: false,
    senderUnread: false,
    lastFrom: null,
    createdAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  })
  return message.threadId
}

// Through the sendThreadMessage Cloud Function: it moderates the text,
// works out which side you are (signed-in owner vs. id holder), enforces
// blocks and updates the unread bookkeeping (2026-10-12).
export async function sendThreadMessage(threadId, text) {
  const call = httpsCallable(functions, 'sendThreadMessage')
  await call({ threadId, text: text.trim() })
}

// Either side reports the conversation (or one message in it) → /admin.
export async function reportThread(threadId, { messageId = null, text = '', reason, by }) {
  await addDoc(collection(db, 'threads', threadId, 'reports'), {
    kind: 'thread',
    messageId,
    text: String(text || '').slice(0, 1000),
    reason,
    by,
    createdAt: serverTimestamp(),
  })
}

export async function markThreadSeen(threadId, side) {
  await updateDoc(threadRef(threadId), { [side === 'owner' ? 'ownerUnread' : 'senderUnread']: false })
}

export async function endThread(threadId) {
  await updateDoc(threadRef(threadId), { status: 'ended', lastActivityAt: serverTimestamp() })
}

// Blocks this thread's sender (their per-link browser key) from sending
// to the link again, and ends the thread. Best-effort: clearing site
// data gives a browser a fresh key.
export async function blockThreadSender(thread) {
  if (thread.senderKey) {
    await updateDoc(doc(db, 'messageEndpoints', thread.endpointId), { blocked: arrayUnion(thread.senderKey) })
  }
  await endThread(thread.id)
}

// Sender opts in to "notify me when they reply": the push token lives in
// threadPush/{threadId}, which no client can read (only Cloud Functions).
export async function saveSenderPushToken(threadId, token) {
  await setDoc(doc(db, 'threadPush', threadId), { token, updatedAt: serverTimestamp() })
}
