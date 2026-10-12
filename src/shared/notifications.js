import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { db, firebaseApp } from './firebase.js'

// Web Push certificate (VAPID) key from Firebase console → Project
// Settings → Cloud Messaging → Web configuration. Public (goes into the
// client bundle), but only generated once someone visits that console
// tab — until it's set, enablePush() just no-ops instead of throwing.
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Asks permission and returns this browser's FCM token (or null). No
// account needed — anonymous senders use it for "notify me when they
// reply" (stored per thread, see threads.js saveSenderPushToken).
export async function getPushToken() {
  if (!VAPID_KEY || !(await isSupported())) return null
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready
  const messaging = getMessaging(firebaseApp)
  return (await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })) || null
}

// Own device/account, so writes are always allowed by firestore.rules'
// users/{uid} rule regardless of what else is on the doc.
export async function enablePush(uid) {
  const token = await getPushToken()
  if (!token) return false

  await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }, { merge: true })
  localStorage.setItem('anix:push-token', token)
  return true
}

export async function disablePush(uid) {
  const token = localStorage.getItem('anix:push-token')
  if (token) {
    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) }).catch(() => {})
    localStorage.removeItem('anix:push-token')
  }
}

export function pushEnabled() {
  return Boolean(localStorage.getItem('anix:push-token'))
}

// Sync/cheap checks only (VAPID key present, APIs exist) — enough to
// decide whether to even show a prompt. enablePush() still does the
// real async isSupported() check (browser/context edge cases) before
// actually registering.
export function pushConfigured() {
  return Boolean(VAPID_KEY) && 'Notification' in window && 'serviceWorker' in navigator
}
