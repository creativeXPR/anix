import { useState } from 'react'
import { CUSTOM_PROMPT_MAX, DEFAULT_GAME, GAMES } from '../games.js'
import { DEFAULT_ROOM_EMOJI } from '../room-defaults.js'
import { THEME_PRESETS } from '../theme-presets.js'
import { swatchStyle } from '../utils/message-gradient.js'
import { uploadBanner } from '../upload-banner.js'
import { useToast } from '../toast-store.js'
import TrashIcon from '../icons/TrashIcon.jsx'
import Button from './Button.jsx'
import EmojiPicker from './EmojiPicker.jsx'
import GamePicker from './GamePicker.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import Sheet from './Sheet.jsx'
import './modal.css'

// Room / link settings: photo + vibe (+ open/closed for rooms) + delete.
// Changes save as they're made — no Save button — matching how the old
// inline panel worked. Opened from LinkCard (Home) and the chat room's
// owner gear. `onDelete` should open the caller's ConfirmDialog.
export default function ItemSettingsSheet({ item, kind, onUpdateSettings, onToggleStatus, togglingStatus, onDelete, onClose }) {
  const showToast = useToast()
  const [uploading, setUploading] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [game, setGame] = useState(item.game || DEFAULT_GAME)
  const [customPrompt, setCustomPrompt] = useState(item.game === 'custom' ? item.prompt || '' : '')
  const [savingGame, setSavingGame] = useState(false)
  const isRoom = kind === 'room'

  // Preset games save the moment they're picked; `custom` waits for the
  // owner's text (saved by the button under the prompt input).
  async function saveGame(nextGame, text) {
    setSavingGame(true)
    try {
      await onUpdateSettings({ game: nextGame, prompt: nextGame === 'custom' ? text.trim() : GAMES[nextGame].prompt })
      showToast('Game saved ✨', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingGame(false)
    }
  }

  function handlePickGame(nextGame) {
    setGame(nextGame)
    if (nextGame !== 'custom') saveGame(nextGame)
  }

  const customDirty =
    game === 'custom' && customPrompt.trim() && !(item.game === 'custom' && item.prompt === customPrompt.trim())

  async function handlePhoto(file) {
    setUploading(true)
    try {
      const bannerImageUrl = await uploadBanner(kind, item.id, file)
      await onUpdateSettings({ bannerImageUrl })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleTheme(themeColor) {
    setSavingTheme(true)
    try {
      await onUpdateSettings({ themeColor })
    } finally {
      setSavingTheme(false)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{isRoom ? 'room settings' : 'link settings'}</h2>

      {isRoom ? (
        <EmojiPicker value={item.emoji || DEFAULT_ROOM_EMOJI} onChange={(emoji) => onUpdateSettings({ emoji })} />
      ) : (
        <div>
          <GamePicker
            value={game}
            customPrompt={customPrompt}
            onChange={handlePickGame}
            onCustomPromptChange={(text) => setCustomPrompt(text.slice(0, CUSTOM_PROMPT_MAX))}
            disabled={savingGame}
          />
          {customDirty && (
            <Button
              size="sm"
              onClick={() => saveGame('custom', customPrompt)}
              loading={savingGame}
              style={{ marginTop: 10 }}
            >
              Save prompt
            </Button>
          )}
        </div>
      )}

      <PhotoPicker
        id={`photo-${item.id}`}
        imageUrl={item.bannerImageUrl}
        fallback={isRoom ? item.emoji || DEFAULT_ROOM_EMOJI : '/icon.svg'}
        hint="shows on your link & when it's shared"
        busy={uploading}
        onPick={handlePhoto}
        onRemove={() => onUpdateSettings({ bannerImageUrl: null })}
      />

      <div>
        <p className="section-label">
          vibe <small>{savingTheme ? 'saving…' : isRoom ? 'room color' : 'your link page color'}</small>
        </p>
        <div className="modal__swatches">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`modal__swatch${(item.themeColor ?? null) === preset.value ? ' modal__swatch--selected' : ''}`}
              style={swatchStyle(preset.value)}
              onClick={() => handleTheme(preset.value)}
              aria-label={preset.value ? preset.label : `${preset.label} (purple)`}
              title={preset.label}
              disabled={savingTheme}
            />
          ))}
        </div>
      </div>

      {isRoom && (
        <div className="opt-row">
          <div>
            <b>room is {item.status === 'open' ? 'open' : 'closed'}</b>
            <small>closed rooms show “not open yet” to visitors</small>
          </div>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={item.status === 'open'}
            aria-label="Room open"
            onClick={onToggleStatus}
            disabled={togglingStatus}
          />
        </div>
      )}

      <Button variant="secondary" size="sm" onClick={onDelete} style={{ alignSelf: 'center' }}>
        <TrashIcon />
        Delete {isRoom ? 'room' : 'link'}
      </Button>
    </Sheet>
  )
}
