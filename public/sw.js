// Minimal service worker — exists mainly to satisfy PWA installability
// criteria (a registered fetch handler), not for offline caching. No
// caching strategy is attempted here: Anix is realtime/Firestore-driven,
// and blanket caching could easily serve stale data. Revisit if genuine
// offline support is ever wanted.
self.addEventListener('fetch', () => {})
