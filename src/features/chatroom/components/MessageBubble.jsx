import { useState } from 'react'
import SendStatus from '../../../shared/components/SendStatus.jsx'
import { useToast } from '../../../shared/toast-store.js'
import BadgeChip from '../../football/BadgeChip.jsx'
import { guestLabel } from '../../../shared/hooks/use-anonymous-participant.js'
import StickerArt from '../../stickers/StickerArt.jsx'
import { badgeNameColor } from '../../football/badges.js'
import { colorForParticipant } from '../../../shared/utils/participant-color.js'
import { hostnameFor, splitTextAndLinks } from '../linkify.js'
import './MessageBubble.css'

const displayName = guestLabel

export default function MessageBubble({
  message,
  isOwn,
  showHeader,
  isHighlighted,
  onReply,
  onReport,
  onJumpToReply,
  onSaveSticker,
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

  // room moderation (when the admin has it on) hid this one
  if (message.filtered) {
    return (
      <div className={`bubble-row${isOwn ? ' bubble-row--own' : ''}`} id={`message-${message.id}`}>
        <div className="bubble bubble--filtered">🛡️ hidden by the filter</div>
      </div>
    )
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
        <span
          className={`bubble-row__sender${message.badge ? ' has-badge' : ''}`}
          style={message.badge ? { '--badge': badgeNameColor(message.badge) } : { color }}
        >
          {displayName(message.senderId)}
          {message.badge && <BadgeChip badge={message.badge} />}
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
            {message.sticker && onSaveSticker && (
              <button
                type="button"
                onClick={() => {
                  onSaveSticker(message.sticker)
                  setActionsOpen(false)
                }}
              >
                Save sticker
              </button>
            )}
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
          className={`bubble${isOwn ? ' bubble--own' : ' bubble--other'}${message.sticker ? ' bubble--sticker' : ''}`}
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

          {message.sticker && <StickerArt sticker={message.sticker} size={128} />}

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
              {isOwn && <SendStatus state={pending ? 'sending' : 'sent'} progress={message.progress} />}
            </p>
          )}
          {isOwn && !message.text && !message.sticker && (
            <span className="bubble__meta">
              <SendStatus state={pending ? 'sending' : 'sent'} progress={message.progress} />
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
