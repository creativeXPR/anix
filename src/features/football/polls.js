import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../shared/firebase.js'

// Room polls (2026-10-13). A poll is a room message of `type: 'poll'`
// with the question as `text` and 2–4 `options` — and deliberately NO
// senderId: nobody (owner included) can be tied to a poll. Votes live at
// rooms/{roomId}/messages/{pollId}/votes/{participantId}: one per guest,
// changeable. Rules validate the shapes.
export const POLL_MIN_OPTIONS = 2
export const POLL_MAX_OPTIONS = 4
export const POLL_QUESTION_MAX = 120
export const POLL_OPTION_MAX = 40
const POLL_COOLDOWN_MS = 60_000

export const POLL_TEMPLATES = [
  { key: 'winner', label: '🏆 Who wins?', question: 'Who wins this one?', options: ['', 'Draw', ''] },
  { key: 'motm', label: '⭐ Man of the match?', question: 'Man of the match?', options: ['', '', ''] },
  { key: 'penalty', label: '🟨 Penalty or not?', question: 'Penalty or not?', options: ['Penalty ✅', 'No penalty ❌', 'VAR check 📺'] },
  { key: 'goat', label: '🐐 Who’s better?', question: 'Who’s better?', options: ['', ''] },
  { key: 'custom', label: '✍️ Custom', question: '', options: ['', ''] },
]

const cooldownKey = (roomId) => `anix:room:${roomId}:last-poll`

export function pollCooldownLeft(roomId) {
  try {
    const last = Number(localStorage.getItem(cooldownKey(roomId)) || 0)
    return Math.max(0, POLL_COOLDOWN_MS - (Date.now() - last))
  } catch {
    return 0
  }
}

export async function createPoll(roomId, question, options) {
  const clean = options.map((o) => o.trim().slice(0, POLL_OPTION_MAX)).filter(Boolean)
  if (!question.trim() || clean.length < POLL_MIN_OPTIONS) throw new Error('Add a question and at least two options.')
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    type: 'poll',
    text: question.trim().slice(0, POLL_QUESTION_MAX),
    options: clean.slice(0, POLL_MAX_OPTIONS),
    createdAt: serverTimestamp(),
  })
  try {
    localStorage.setItem(cooldownKey(roomId), String(Date.now()))
  } catch {
    // no cooldown memory — fine
  }
  await setDoc(doc(db, 'rooms', roomId), { lastActivityAt: serverTimestamp() }, { merge: true })
}

export function votesRef(roomId, pollId) {
  return collection(db, 'rooms', roomId, 'messages', pollId, 'votes')
}

export function subscribeToVotes(roomId, pollId, onChange) {
  return onSnapshot(votesRef(roomId, pollId), (snap) =>
    onChange(snap.docs.map((d) => ({ id: d.id, option: d.data().option }))),
  )
}

export function castVote(roomId, pollId, participantId, option) {
  return setDoc(doc(votesRef(roomId, pollId), participantId), { option, updatedAt: serverTimestamp() })
}
