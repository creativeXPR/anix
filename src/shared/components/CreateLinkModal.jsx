import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GAME, GAMES } from '../games.js'
import { DEFAULT_ROOM_EMOJI } from '../room-defaults.js'
import { THEME_PRESETS } from '../theme-presets.js'
import { messageGradientVars, swatchStyle } from '../utils/message-gradient.js'
import Button from './Button.jsx'
import EmojiPicker from './EmojiPicker.jsx'
import GamePicker from './GamePicker.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import Sheet from './Sheet.jsx'
import './modal.css'
import './CreateLinkModal.css'

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{2,23}$/

// New room / new link sheet: live preview on top (updates as you type and
// pick), then name, the game (links) or emoji (rooms), photo, vibe — and
// for rooms, whether it opens right away (rooms are created closed, as
// createRoom always has).
export default function CreateLinkModal({ kind, onCreate, onClose }) {
  const isRoom = kind === 'room'
  const [handle, setHandle] = useState('')
  const [themeColor, setThemeColor] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [openNow, setOpenNow] = useState(false)
  const [game, setGame] = useState(DEFAULT_GAME)
  const [customPrompt, setCustomPrompt] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_ROOM_EMOJI)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Local preview of the picked photo; revoked when replaced/unmounted.
  const previewUrl = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : null), [bannerFile])
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  async function handleSubmit(event) {
    event.preventDefault()
    const normalized = handle.trim().toLowerCase()
    if (!HANDLE_PATTERN.test(normalized)) {
      setError('3–24 characters: lowercase letters, numbers, or hyphens.')
      return
    }
    if (!isRoom && game === 'custom' && !customPrompt.trim()) {
      setError('Write your custom prompt, or pick another game.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onCreate({
        handle: normalized,
        themeColor,
        bannerFile,
        open: isRoom && openNow,
        emoji: isRoom ? emoji : undefined,
        game: isRoom ? undefined : game,
        prompt: isRoom ? undefined : game === 'custom' ? customPrompt.trim() : GAMES[game].prompt,
      })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const name = handle.trim().toLowerCase() || (isRoom ? 'your room' : 'your-link')

  return (
    <Sheet as="form" onClose={onClose} onSubmit={handleSubmit}>
      <h2>{isRoom ? 'new room' : 'new link'}</h2>

      <div className="create-preview" style={messageGradientVars(themeColor)} aria-hidden="true">
        {previewUrl ? (
          <img className="create-preview__badge" src={previewUrl} alt="" />
        ) : isRoom ? (
          <span className="create-preview__badge create-preview__badge--emoji">{emoji}</span>
        ) : (
          <img className="create-preview__badge" src="/icon.svg" alt="" />
        )}
        <div>
          <b>{isRoom ? name : `@${name}`}</b>
          <small>
            {isRoom
              ? `${openNow ? '🟢 open' : '🔒 closed'} · anonymous`
              : (game === 'custom' ? customPrompt.trim() : GAMES[game].prompt) || 'your prompt…'}
          </small>
        </div>
      </div>

      <input
        id="handle"
        className="field"
        type="text"
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
        placeholder={isRoom ? 'name it (e.g. movie-night)' : 'name it (e.g. spill)'}
        aria-label="Name"
        autoComplete="off"
        maxLength={24}
        required
      />

      {isRoom ? (
        <EmojiPicker value={emoji} onChange={setEmoji} />
      ) : (
        <GamePicker value={game} customPrompt={customPrompt} onChange={setGame} onCustomPromptChange={setCustomPrompt} />
      )}

      <PhotoPicker
        id="create-photo"
        imageUrl={previewUrl}
        fallback={isRoom ? emoji : '/icon.svg'}
        hint={isRoom ? 'replaces the emoji & shows on shares' : 'shows on your link & shares'}
        onPick={setBannerFile}
        onRemove={() => setBannerFile(null)}
      />

      <div>
        <p className="section-label">
          vibe <small>{isRoom ? 'room color' : 'your link page color'}</small>
        </p>
        <div className="modal__swatches">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`modal__swatch${themeColor === preset.value ? ' modal__swatch--selected' : ''}`}
              style={swatchStyle(preset.value)}
              onClick={() => setThemeColor(preset.value)}
              aria-label={preset.value ? preset.label : `${preset.label} (purple)`}
              title={preset.label}
            />
          ))}
        </div>
      </div>

      {isRoom && (
        <div className="opt-row">
          <div>
            <b>open the room now</b>
            <small>closed rooms show “not open yet” to visitors</small>
          </div>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={openNow}
            aria-label="Open the room now"
            onClick={() => setOpenNow((value) => !value)}
          />
        </div>
      )}

      {isRoom && <p className="create-note">⏳ rooms vanish after 2 days with no messages</p>}

      {error && <p className="error-text text-b3">{error}</p>}

      <Button type="submit" block loading={submitting}>
        {submitting ? 'Creating…' : isRoom ? 'Create room' : 'Create link'}
      </Button>
    </Sheet>
  )
}
