import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// /welcome/contact → contact/{id}, readable only in /admin (firestore.rules
// validates the shape; no account needed to send). `email` is optional —
// only if the person wants a reply.
export const CONTACT_TOPICS = ['question', 'idea', 'bug', 'safety report', 'business', 'other']

export async function sendContactMessage({ topic, email, message }) {
  await addDoc(collection(db, 'contact'), {
    topic,
    email: email.trim() || null,
    message: message.trim(),
    createdAt: serverTimestamp(),
  })
}
