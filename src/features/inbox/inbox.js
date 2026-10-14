import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '../../shared/firebase.js'
import { subscribeToIndexedDocs } from '../../shared/owned-docs.js'
import { functions, sendFunctions } from '../../shared/firebase-functions.js'

const PAGE_SIZE = 50

// Up to 3 anonymous-message endpoints per account (2026-09-19 rebuild —
// superseded the earlier "one endpoint per account, keyed by uid" model).
// Same handle-uniqueness/3-cap reasoning as rooms — see messages.js.
export async function createEndpointHandle(handle, themeColor) {
  const call = httpsCallable(functions, 'createMessageEndpoint')
  const result = await call({ handle, themeColor: themeColor || null })
  return result.data.id
}

export async function deleteEndpointHandle(endpointId) {
  const call = httpsCallable(functions, 'deleteMessageEndpoint')
  await call({ id: endpointId })
}

// Your links: ids from the private owners/{uid} index (owner privacy).
export function subscribeToOwnedEndpoints(uid, onChange) {
  return subscribeToIndexedDocs(`owners/${uid}`, 'endpoints', 'messageEndpoints', onChange)
}

export async function updateEndpointSettings(endpointId, updates) {
  await setDoc(doc(db, 'messageEndpoints', endpointId), updates, { merge: true })
}

function endpointMessagesRef(endpointId) {
  return collection(db, 'messageEndpoints', endpointId, 'messages')
}

// Anonymous senders never need to be signed in. Sending goes through the
// sendAnonymousMessage Cloud Function (2026-10-12), which runs automated
// moderation BEFORE the message reaches the inbox, snapshots the link's
// game/prompt and enforces blocks — clients can't write messages directly.
// `threadId`/`senderKey` come from the sender's browser
// (features/threads/threads.js): the capability for a later private
// conversation, and the key a block applies to.
export async function sendAnonymousMessage(endpointId, text, { threadId, senderKey }) {
  const call = httpsCallable(sendFunctions, 'sendAnonymousMessage')
  const result = await call({ endpointId, text: text.trim(), threadId, senderKey })
  return result.data.id
}

// Sealed = never opened. Messages from before sealed tiles have no `read`
// field (count as read); moderation-filtered ones live in the "filtered"
// folder instead and never count as new.
export function isUnread(message) {
  return message.read === false && !message.filtered
}

export const REPORT_REASONS = [
  { value: 'harassment', label: 'bullying or harassment' },
  { value: 'hate', label: 'hate' },
  { value: 'threat', label: 'threats or violence' },
  { value: 'sexual', label: 'sexual content' },
  { value: 'self-harm', label: 'self-harm' },
  { value: 'spam', label: 'spam' },
  { value: 'other', label: 'something else' },
]

// The link owner reports a received message → /admin (Reports).
export async function reportReceivedMessage(endpointId, message, reason) {
  await addDoc(collection(db, 'messageEndpoints', endpointId, 'reports'), {
    kind: 'message',
    messageId: message.id,
    text: String(message.text || '').slice(0, 1000),
    reason,
    createdAt: serverTimestamp(),
  })
}

// Owner-only updates — firestore.rules limits them to exactly these
// fields (read / answer / answeredAt).
export async function markMessageRead(endpointId, messageId) {
  await updateDoc(doc(db, 'messageEndpoints', endpointId, 'messages', messageId), { read: true })
}

export async function saveAnswer(endpointId, messageId, answer) {
  const trimmed = answer.trim()
  await updateDoc(doc(db, 'messageEndpoints', endpointId, 'messages', messageId), {
    answer: trimmed || null,
    answeredAt: trimmed ? serverTimestamp() : null,
  })
}

export async function deleteReceivedMessage(endpointId, messageId) {
  await deleteDoc(doc(db, 'messageEndpoints', endpointId, 'messages', messageId))
}

export function subscribeToInbox(endpointId, onChange) {
  const inboxQuery = query(endpointMessagesRef(endpointId), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
  return onSnapshot(inboxQuery, (snapshot) => {
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })))
  })
}
