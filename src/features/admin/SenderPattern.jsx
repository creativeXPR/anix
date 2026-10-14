import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../shared/firebase.js'
import { resolveSender } from './sender-source.js'

// "Browser pattern" for /admin (2026-10-12): who sent this, as far as Anix
// knows — never an identity, just the sender's random per-link browser key
// (or a room guest id) shown as a short tag, plus how many messages that
// same browser/guest has sent there and how many were flagged. Enough to
// spot one person harassing repeatedly, and to block them.
//
// `source` is one of:
//   { kind: 'link', endpointId, senderKey }
//   { kind: 'room', roomId, senderId }
async function countFor(source) {
  if (source.kind === 'room') {
    const base = collection(db, 'rooms', source.roomId, 'messages')
    const sent = await getCountFromServer(query(base, where('senderId', '==', source.senderId)))
    return { sent: sent.data().count, flagged: null }
  }
  const base = collection(db, 'messageEndpoints', source.endpointId, 'messages')
  const [sent, flagged] = await Promise.all([
    getCountFromServer(query(base, where('senderKey', '==', source.senderKey))),
    getCountFromServer(query(base, where('senderKey', '==', source.senderKey), where('filtered', '==', true))),
  ])
  return { sent: sent.data().count, flagged: flagged.data().count }
}

export function SenderPattern({ source }) {
  const [counts, setCounts] = useState(null)
  const key = source ? JSON.stringify(source) : ''

  useEffect(() => {
    if (!source) return undefined
    let cancelled = false
    countFor(source)
      .then((c) => !cancelled && setCounts(c))
      .catch(() => !cancelled && setCounts({ error: true }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!source) return <span className="admin-pattern">sender unknown (sent before sender keys existed)</span>
  const tag = source.kind === 'room' ? `guest ${source.senderId}` : `browser ${source.senderKey.slice(0, 6)}`
  return (
    <span className="admin-pattern" title="Not an identity — a random code from the sender's browser">
      🧭 {tag}
      {counts?.error
        ? ' · counts unavailable'
        : counts
          ? ` · sent ${counts.sent} ${source.kind === 'room' ? 'in this room' : 'to this link'}${counts.flagged != null ? ` · ${counts.flagged} flagged` : ''}`
          : ' · counting…'}
    </span>
  )
}

// Async wrapper: resolves, then renders the pattern (or the owner account).
export function ResolvedSender({ target }) {
  const [source, setSource] = useState(undefined)
  const key = JSON.stringify({ ...target, message: target.message ? { s: target.message.senderKey, i: target.message.senderId, f: target.message.from } : null })

  useEffect(() => {
    let cancelled = false
    resolveSender(target)
      .then((s) => !cancelled && setSource(s))
      .catch(() => !cancelled && setSource(null))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (source === undefined) return <span className="admin-pattern">🧭 …</span>
  if (source?.kind === 'owner') {
    return <span className="admin-pattern">👤 the link owner (of link {source.endpointId}) — not anonymous</span>
  }
  return <SenderPattern source={source} />
}
