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
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../shared/firebase.js'

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

export function subscribeToOwnedEndpoints(uid, onChange) {
  const ownedQuery = query(collection(db, 'messageEndpoints'), where('ownerId', '==', uid))
  return onSnapshot(ownedQuery, (snapshot) => {
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })))
  })
}

export async function updateEndpointSettings(endpointId, updates) {
  await setDoc(doc(db, 'messageEndpoints', endpointId), updates, { merge: true })
}

function endpointMessagesRef(endpointId) {
  return collection(db, 'messageEndpoints', endpointId, 'messages')
}

// Anonymous senders never need to be signed in — matches the "receive
// anonymous messages" feature (see firestore.rules: create is open,
// read is owner-only).
export async function sendAnonymousMessage(endpointId, text) {
  await addDoc(endpointMessagesRef(endpointId), {
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
}

export function subscribeToInbox(endpointId, onChange) {
  const inboxQuery = query(endpointMessagesRef(endpointId), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
  return onSnapshot(inboxQuery, (snapshot) => {
    onChange(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })))
  })
}
