import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// Create-only from the client (see firestore.rules) — read via the
// Firebase console / a future admin tool, not by any signed-in user.
export async function submitFeedback(userId, text) {
  await addDoc(collection(db, 'feedback'), {
    userId,
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
}
