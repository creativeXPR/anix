import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// Values come from Vite's VITE_-prefixed env vars — see .env.example.
// Anix shares the "c-xpr25" Firebase project with other apps (see
// CLAUDE.md #008) rather than owning its own project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
// Named database, not the project's default one — that's what actually
// separates Anix's data from the other apps sharing this project.
export const db = getFirestore(firebaseApp, 'anix')
export const storage = getStorage(firebaseApp)
export const functions = getFunctions(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

// Lazy, unlike db/storage above: getAuth() validates the API key
// synchronously and throws if it's missing/invalid, which would crash
// every screen at import time (not just the auth screen) while .env is
// still unfilled. Called only from inside AuthScreen's submit handlers,
// which already catch and display the error.
let authInstance
export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(firebaseApp)
  }
  return authInstance
}
