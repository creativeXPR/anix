import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// Resolves the sender behind a moderation-queue item or a report.
export async function resolveSender({ where: place, parentId, message, messageId, by }) {
  if (place === 'room') {
    let senderId = message?.senderId
    if (!senderId && messageId) senderId = (await getDoc(doc(db, 'rooms', parentId, 'messages', messageId))).data()?.senderId
    return senderId ? { kind: 'room', roomId: parentId, senderId } : null
  }
  if (place === 'thread') {
    const thread = (await getDoc(doc(db, 'threads', parentId))).data()
    // reported/flagged by the anonymous side → the sender is the link
    // owner (an account), not a browser
    if (!thread || by === 'sender' || message?.from === 'owner') return thread ? { kind: 'owner', ownerId: thread.ownerId, endpointId: thread.endpointId } : null
    return thread.senderKey ? { kind: 'link', endpointId: thread.endpointId, senderKey: thread.senderKey } : null
  }
  let senderKey = message?.senderKey
  if (!senderKey && messageId) senderKey = (await getDoc(doc(db, 'messageEndpoints', parentId, 'messages', messageId))).data()?.senderKey
  return senderKey ? { kind: 'link', endpointId: parentId, senderKey } : null
}
