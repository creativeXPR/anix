// Minimal service worker — exists mainly to satisfy PWA installability
// criteria (a registered fetch handler), not for offline caching. No
// caching strategy is attempted here: Anix is realtime/Firestore-driven,
// and blanket caching could easily serve stale data. Revisit if genuine
// offline support is ever wanted.
self.addEventListener('fetch', () => {})

// Push notifications (#006, 2026-09-21): a service worker is the only
// place a *background* (app/tab closed) push can be received and shown
// — this can't live in React code. Config here is the same values as
// src/shared/firebase.js's VITE_FIREBASE_* — safe to hardcode, per
// 008-F this is the public client config, not a secret (unlike the
// Admin SDK key). importScripts (not `import`) because this file runs
// as a classic-script service worker, not a module.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDyiA-AvfOmUX8BTNRKVjpGO8veivKeSJc',
  authDomain: 'c-xpr25.firebaseapp.com',
  projectId: 'c-xpr25',
  storageBucket: 'c-xpr25.firebasestorage.app',
  messagingSenderId: '560670758532',
  appId: '1:560670758532:web:9180b589e43a30523614d1',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'Anix', {
    body,
    icon: '/icon.jpg',
    badge: '/icon.jpg',
  })
})
