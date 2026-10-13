import { useEffect, useRef, useState } from 'react'
import ArrowRightIcon from '../../../shared/icons/ArrowRightIcon.jsx'
import CloseIcon from '../../../shared/icons/CloseIcon.jsx'
import ImageIcon from '../../../shared/icons/ImageIcon.jsx'
import { EmojiPanelSlot, EmojiToggle } from '../../../shared/emoji/EmojiToggle.jsx'
import { useEmojiInput } from '../../../shared/emoji/use-emoji-input.js'
import './Composer.css'

const TYPING_STOP_DELAY_MS = 2000

export default function Composer({ replyTo, onCancelReply, onSend, onTypingChange, disabled }) {
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current)
  }, [])

  function handleTextChange(event) {
    updateText(event.target.value)
  }

  function updateText(value) {
    setText(value)

    onTypingChange(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange(false)
    }, TYPING_STOP_DELAY_MS)
  }

  const emoji = useEmojiInput({ inputRef, value: text, setValue: updateText })

  function handleSend() {
    if (!text.trim() && !imageFile) return
    onSend({ text: text.trim(), imageFile })
    setText('')
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    clearTimeout(typingTimeoutRef.current)
    onTypingChange(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="composer">
      {replyTo && (
        <div className="composer__reply-preview">
          {replyTo.imageUrl && (
            <img className="composer__reply-thumb" src={replyTo.imageUrl} alt="" />
          )}
          <span>
            <b>replying to</b> {replyTo.text || (replyTo.imageUrl ? 'Photo' : '')}
          </span>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply">
            <CloseIcon />
          </button>
        </div>
      )}

      {imageFile && (
        <div className="composer__image-preview">
          <span>📷 {imageFile.name}</span>
          <button
            type="button"
            onClick={() => {
              setImageFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            aria-label="Remove image"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* NGL redesign: one floating pill — image button, text, round send. */}
      <div className="composer__row">
        <button
          type="button"
          className="icon-btn composer__attach"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          disabled={disabled}
        >
          <ImageIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
        <EmojiToggle open={emoji.open} onToggle={emoji.toggle} className="composer__emoji" disabled={disabled} />
        <textarea
          ref={inputRef}
          {...emoji.fieldProps}
          className="composer__input"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'this room is closed' : 'say something…'}
          aria-label="Message"
          rows={1}
          disabled={disabled}
        />
        <button
          type="button"
          className="composer__send"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !imageFile)}
          aria-label="Send"
        >
          <ArrowRightIcon />
        </button>
      </div>
      <EmojiPanelSlot open={emoji.open && !disabled} onPick={emoji.insert} onBackspace={emoji.backspace} />
    </div>
  )
}
