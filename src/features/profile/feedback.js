import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// Create-only from the client (see firestore.rules) — read in /admin.
// `kind` ('bug' | 'idea' | 'love' | null) added in the NGL redesign so
// the admin view can tell them apart; the rule accepts any fields.
export async function submitFeedback(userId, text, kind = null) {
  await addDoc(collection(db, 'feedback'), {
    userId,
    text: text.trim(),
    kind,
    createdAt: serverTimestamp(),
  })
}
