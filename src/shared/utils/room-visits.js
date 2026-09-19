// Local-only "last seen" bookkeeping per room, so a returning visitor can
// see an unread count without any per-message read-receipt tracking —
// that doesn't fit anonymous participants well.
function storageKey(roomId) {
  return `anix:room:${roomId}:lastVisitAt`
}

export function getLastVisit(roomId) {
  const stored = localStorage.getItem(storageKey(roomId))
  return stored ? Number(stored) : 0
}

export function markVisited(roomId) {
  localStorage.setItem(storageKey(roomId), String(Date.now()))
}
