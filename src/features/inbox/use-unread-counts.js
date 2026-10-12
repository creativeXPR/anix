import { useEffect, useState } from 'react'
import { isUnread, subscribeToInbox, subscribeToOwnedEndpoints } from './inbox.js'

// Unread (sealed) message counts per link + total, for the nav badge and
// Home's "N new" pills. Firestore shares the underlying listeners with
// Chats/Home when they subscribe to the same queries, so this doesn't
// double the reads. Counts within each inbox's newest page (50).
export function useUnreadCounts(uid) {
  const [endpoints, setEndpoints] = useState([])
  const [counts, setCounts] = useState({})

  useEffect(() => (uid ? subscribeToOwnedEndpoints(uid, setEndpoints) : undefined), [uid])

  useEffect(() => {
    const unsubscribes = endpoints.map((endpoint) =>
      subscribeToInbox(endpoint.id, (messages) =>
        setCounts((current) => ({ ...current, [endpoint.id]: messages.filter(isUnread).length })),
      ),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [endpoints])

  const live = Object.fromEntries(endpoints.map((endpoint) => [endpoint.id, counts[endpoint.id] || 0]))
  const total = Object.values(live).reduce((sum, count) => sum + count, 0)
  return { byEndpoint: live, total }
}
