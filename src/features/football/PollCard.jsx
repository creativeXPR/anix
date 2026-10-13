import { useEffect, useState } from 'react'
import { useToast } from '../../shared/toast-store.js'
import { castVote, subscribeToVotes } from './polls.js'
import './football.css'

// A poll in the room timeline. No sender shown or stored — polls are
// never attributed. Tap an option to vote (tap another to change).
export default function PollCard({ roomId, message, participantId, disabled }) {
  const showToast = useToast()
  const [votes, setVotes] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeToVotes(roomId, message.id, setVotes), [roomId, message.id])

  const options = message.options || []
  const counts = options.map((_, i) => votes.filter((v) => v.option === i).length)
  const total = counts.reduce((a, b) => a + b, 0)
  const mine = votes.find((v) => v.id === participantId)?.option
  const leader = total ? counts.indexOf(Math.max(...counts)) : -1

  async function vote(index) {
    if (busy || disabled || index === mine) return
    setBusy(true)
    try {
      await castVote(roomId, message.id, participantId, index)
    } catch {
      showToast('Could not vote — try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="poll-card pop-in" id={`message-${message.id}`}>
      <span className="poll-card__tag">📊 poll</span>
      <p className="poll-card__question">{message.text}</p>
      <div className="poll-card__options">
        {options.map((option, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0
          return (
            <button
              key={i}
              type="button"
              className={`poll-card__option${mine === i ? ' is-mine' : ''}${i === leader ? ' is-leading' : ''}`}
              onClick={() => vote(i)}
              disabled={disabled}
              aria-pressed={mine === i}
            >
              <span className="poll-card__bar" style={{ width: mine === undefined ? '0%' : `${pct}%` }} aria-hidden="true" />
              <span className="poll-card__label">
                {mine === i && <b aria-hidden="true">✓ </b>}
                {option}
              </span>
              {mine !== undefined && <span className="poll-card__pct">{pct}%</span>}
            </button>
          )
        })}
      </div>
      <small className="poll-card__meta">
        {total} {total === 1 ? 'vote' : 'votes'}
        {mine === undefined ? ' · vote to see results' : ' · tap another to change'}
      </small>
    </div>
  )
}
