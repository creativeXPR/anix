import { useState } from 'react'
import { useToast } from '../../../shared/toast-store.js'
import { colorForParticipant } from '../../../shared/utils/participant-color.js'
import { hostnameFor, splitTextAndLinks } from '../linkify.js'
import './MessageBubble.css'

function displayName(participantId) {
  return `Guest ${participantId}`
}

export default function MessageBubble({
  message,
  isOwn,
  showHeader,
  isHighlighted,
  onReply,
  onReport,
  onJumpToReply,
}) {
  const showToast = useToast()
  const [actionsOpen, setActionsOpen] = useState(false)
  const color = colorForParticipant(message.senderId)
  const pending = Boolean(message.pending)

  function handleCopy() {
    setActionsOpen(false)
    if (!message.text) {
      showToast('No text to copy', 'error')
      return
    }
    navigator.clipboard?.writeText(message.text)
    showToast('Copied', 'success')
  }

  return (
    <div
      className={[
        'bubble-row',
        isOwn && 'bubble-row--own',
        isHighlighted && 'bubble-row--highlight',
        pending && 'bubble-row--pending',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`message-${message.id}`}
    >
      {showHeader && !isOwn && (
        <span className="bubble-row__sender" style={{ color }}>
          {displayName(message.senderId)}
        </span>
      )}

      <div className="bubble-wrap">
        {actionsOpen && (
          <div className="bubble-actions">
            <button type="button" onClick={handleCopy}>
              Copy
            </button>
            <button
              type="button"
              onClick={() => {
                onReply(message)
                setActionsOpen(false)
              }}
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => {
                onReport(message)
                setActionsOpen(false)
              }}
            >
              Report
            </button>
          </div>
        )}

        <button
          type="button"
          className={`bubble${isOwn ? ' bubble--own' : ' bubble--other'}`}
          onClick={() => !pending && setActionsOpen((open) => !open)}
          disabled={pending}
        >
          {message.replyTo && (
            <button
              type="button"
              className="bubble__reply-strip"
              onClick={(event) => {
                event.stopPropagation()
                onJumpToReply(message.replyTo.id)
              }}
            >
              {message.replyTo.imageUrl && (
                <img className="bubble__reply-thumb" src={message.replyTo.imageUrl} alt="" />
              )}
              <div className="bubble__reply-strip-text">
                <strong>{displayName(message.replyTo.senderId)}</strong>
                <span>{message.replyTo.text || (message.replyTo.imageUrl ? 'Photo' : '')}</span>
              </div>
            </button>
          )}

          {message.imageUrl && (
            <img className="bubble__image" src={message.imageUrl} alt="" />
          )}

          {message.text && (
            <p className="bubble__text">
              {splitTextAndLinks(message.text).map((segment, index) =>
                segment.type === 'link' ? (
                  <a
                    key={index}
                    href={segment.value}
                    target="_blank"
                    rel="noreferrer"
                    className="bubble__link"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {hostnameFor(segment.value)}
                  </a>
                ) : (
                  <span key={index}>{segment.value}</span>
                ),
              )}
            </p>
          )}
        </button>
      </div>
    </div>
  )
}
