// Short relative time ("just now", "5m", "3h", "2d", then a date) for a
// Firestore Timestamp. createdAt is briefly null on a fresh message while
// the serverTimestamp() is pending, so that reads as "just now" too.
export function timeAgo(timestamp) {
  if (!timestamp?.toDate) return 'just now'
  const date = timestamp.toDate()
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
