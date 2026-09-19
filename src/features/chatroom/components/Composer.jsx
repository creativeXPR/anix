import { useEffect, useRef, useState } from 'react'
import Button from '../../../shared/components/Button.jsx'
import CloseIcon from '../../../shared/icons/CloseIcon.jsx'
import './Composer.css'

const TYPING_STOP_DELAY_MS = 2000

export default function Composer({ replyTo, onCancelReply, onSend, onTypingChange, disabled }) {
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current)
  }, [])

  function handleTextChange(event) {
    setText(event.target.value)

    onTypingChange(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange(false)
    }, TYPING_STOP_DELAY_MS)
  }

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
          <span>Replying to: {replyTo.text || (replyTo.imageUrl ? 'Photo' : '')}</span>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply">
            <CloseIcon />
          </button>
        </div>
      )}

      {imageFile && (
        <div className="composer__image-preview">
          <span>{imageFile.name}</span>
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

      <div className="composer__row">
        <button
          type="button"
          className="composer__attach"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          disabled={disabled}
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
        <textarea
          className="composer__input"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'This room is closed' : 'Message…'}
          rows={1}
          disabled={disabled}
        />
        <Button className="composer__send" onClick={handleSend} disabled={disabled}>
          Send
        </Button>
      </div>
    </div>
  )
}
