import { useEffect, useState } from 'react'
import { useToast } from '../../shared/toast-store.js'
import { shareImage } from '../../shared/utils/share-image.js'
import { generatePollStoryBlob } from './share-cards.js'
import { castVote, subscribeToVotes } from './polls.js'
import './football.css'

// A poll in the room timeline. No sender shown or stored — polls are
// never attributed. Tap an option to vote (tap another to change).
export default function PollCard({ roomId, room, message, participantId, disabled }) {
  const showToast = useToast()
  const [votes, setVotes] = useState([])
  const [busy, setBusy] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => subscribeToVotes(roomId, message.id, setVotes), [roomId, message.id])

  const options = message.options || []
  const counts = options.map((_, i) => votes.filter((v) => v.option === i).length)
  const total = counts.reduce((a, b) => a + b, 0)
  const mine = votes.find((v) => v.id === participantId)?.option
  const leader = total ? counts.indexOf(Math.max(...counts)) : -1

  // Results as a story image with the room link — for WhatsApp status etc.
  async function share() {
    if (sharing) return
    setSharing(true)
    try {
      const link = `${window.location.origin}/r/${roomId}`
      const blob = await generatePollStoryBlob({
        question: message.text,
        options,
        counts,
        roomName: room?.handle || 'anix',
        themeColor: room?.themeColor,
        link,
      })
      await shareImage(blob, { link, text: `${message.text} 👀 vote anonymously: ${link}`, filename: 'anix-poll.png' }, showToast)
    } catch {
      showToast('Could not make the image', 'error')
    } finally {
      setSharing(false)
    }
  }

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

  if (message.filtered) {
    return (
      <div className="room-event" id={`message-${message.id}`}>
        <span>🛡️ a poll was hidden by the filter</span>
      </div>
    )
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
      <div className="poll-card__foot">
        <small className="poll-card__meta">
          {total} {total === 1 ? 'vote' : 'votes'}
          {mine === undefined ? ' · vote to see results' : ' · tap another to change'}
        </small>
        {mine !== undefined && (
          <button type="button" className="poll-card__share" onClick={share} disabled={sharing}>
            {sharing ? '…' : 'share ↗'}
          </button>
        )}
      </div>
    </div>
  )
}
