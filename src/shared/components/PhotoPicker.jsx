import { useState } from 'react'
import ImageIcon from '../icons/ImageIcon.jsx'
import TrashIcon from '../icons/TrashIcon.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import Spinner from './Spinner.jsx'
import './PhotoPicker.css'

// "your photo" row: round preview + Upload/Change (a <label> for a
// visually-hidden file input, so it works without JS) + remove, which
// goes through ConfirmDialog like every other remove. `fallback` is
// what the preview shows with no photo — an image URL or an emoji.
export default function PhotoPicker({ id, imageUrl, fallback, label = 'photo', hint, busy, onPick, onRemove }) {
  const [confirming, setConfirming] = useState(false)
  const fallbackIsImage = typeof fallback === 'string' && fallback.startsWith('/')

  return (
    <div className="photo-picker">
      {imageUrl || fallbackIsImage ? (
        <img className="photo-picker__preview" src={imageUrl || fallback} alt="" />
      ) : (
        <span className="photo-picker__preview photo-picker__preview--emoji">{fallback || '📷'}</span>
      )}
      <div className="photo-picker__copy">
        <b>{imageUrl ? `your ${label}` : `add a ${label}`}</b>
        {hint && <small>{hint}</small>}
      </div>
      <div className="photo-picker__actions">
        <label htmlFor={id} className={`btn btn--primary btn--sm${busy ? ' photo-picker__busy' : ''}`}>
          {busy ? <Spinner size={14} /> : <ImageIcon />}
          {busy ? 'Uploading…' : imageUrl ? 'Change' : 'Upload'}
        </label>
        {imageUrl && onRemove && !busy && (
          <button type="button" className="icon-btn" onClick={() => setConfirming(true)} aria-label={`Remove ${label}`}>
            <TrashIcon />
          </button>
        )}
      </div>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="photo-picker__input"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = '' // so picking the same file again still fires
          if (file) onPick(file)
        }}
      />
      {confirming && (
        <ConfirmDialog
          title={`remove ${label}?`}
          message="It goes back to the default picture."
          confirmLabel="Remove"
          onConfirm={() => {
            setConfirming(false)
            onRemove()
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
