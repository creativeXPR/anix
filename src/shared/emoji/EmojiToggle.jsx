import { lazy, Suspense } from 'react'
import './EmojiPanel.css'

// The panel (and its emoji list) loads the first time it's opened.
const EmojiPanel = lazy(() => import('./EmojiPanel.jsx'))

// Smiley ↔ keyboard button, like WhatsApp's: shows what tapping it brings up.
export function EmojiToggle({ open, onToggle, className = '', disabled }) {
  return (
    <button
      type="button"
      className={`icon-btn emoji-toggle ${className}`}
      onClick={onToggle}
      aria-label={open ? 'Show keyboard' : 'Show emojis'}
      aria-expanded={open}
      disabled={disabled}
      // keep the text field's selection on desktop
      onMouseDown={(event) => event.preventDefault()}
    >
      {open ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
          <path d="M6.5 9.5h.01M10 9.5h.01M13.5 9.5h.01M17 9.5h.01M6.5 12.5h.01M10 12.5h.01M13.5 12.5h.01M17 12.5h.01M8 15.5h8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M8 14.2c1 1.5 2.4 2.3 4 2.3s3-.8 4-2.3M9 9.5h.01M15 9.5h.01" />
        </svg>
      )}
    </button>
  )
}

export function EmojiPanelSlot({ open, onPick, onBackspace, stickers }) {
  if (!open) return null
  return (
    <Suspense fallback={<div className="emoji-panel emoji-panel--loading" />}>
      <EmojiPanel onPick={onPick} onBackspace={onBackspace} stickers={stickers} />
    </Suspense>
  )
}
