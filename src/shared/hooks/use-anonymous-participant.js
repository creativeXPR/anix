import { useState } from 'react'
import { generateAnonymousId } from '../utils/anonymous-id.js'

// Persists a per-room anonymous id in localStorage so a refresh doesn't
// hand the same person a new identity mid-conversation. Different rooms
// get different ids — nothing links a participant across rooms.
export function useAnonymousParticipant(roomId) {
  const [participantId] = useState(() => {
    const storageKey = `anix:room:${roomId}:participantId`
    const existing = localStorage.getItem(storageKey)
    if (existing) return existing

    const id = generateAnonymousId()
    localStorage.setItem(storageKey, id)
    return id
  })

  return participantId
}
