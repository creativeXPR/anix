import { useState } from 'react'
import { THEME_PRESETS } from '../theme-presets.js'
import Button from './Button.jsx'
import FilePicker from './FilePicker.jsx'
import './modal.css'
import './CreateLinkModal.css'

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{2,23}$/

export default function CreateLinkModal({ title, onCreate, onClose }) {
  const [handle, setHandle] = useState('')
  const [themeColor, setThemeColor] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const normalized = handle.trim().toLowerCase()
    if (!HANDLE_PATTERN.test(normalized)) {
      setError('Handle must be 3-24 characters: lowercase letters, numbers, or hyphens.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onCreate({ handle: normalized, themeColor, bannerFile })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{title}</h2>

        <label className="text-b3" htmlFor="handle">
          Handle
        </label>
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="e.g. movie-night"
          maxLength={24}
          required
        />

        <label className="text-b3" htmlFor="banner">
          Banner image (optional — shows when your link is shared)
        </label>
        <FilePicker id="banner" file={bannerFile} onChange={setBannerFile} />

        <span className="text-b3">Color theme</span>
        <div className="modal__swatches">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`modal__swatch${themeColor === preset.value ? ' modal__swatch--selected' : ''}`}
              style={{ background: preset.value || 'var(--primary)' }}
              onClick={() => setThemeColor(preset.value)}
              aria-label={preset.label}
              title={preset.label}
            />
          ))}
        </div>

        {error && <p className="error-text text-b3">{error}</p>}

        <div className="modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
