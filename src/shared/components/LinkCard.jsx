import { useState } from 'react'
import { THEME_PRESETS } from '../theme-presets.js'
import { uploadBanner } from '../upload-banner.js'
import { useCopyLink } from '../hooks/use-copy-link.js'
import { useToast } from '../toast-store.js'
import ArrowRightIcon from '../icons/ArrowRightIcon.jsx'
import CloseIcon from '../icons/CloseIcon.jsx'
import CopyIcon from '../icons/CopyIcon.jsx'
import PowerIcon from '../icons/PowerIcon.jsx'
import SettingsIcon from '../icons/SettingsIcon.jsx'
import Card from './Card.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import FilePicker from './FilePicker.jsx'
import './LinkCard.css'
import './modal.css'
import Spinner from './Spinner.jsx'

// One room or one message-endpoint, as a card with its own actions —
// shared between Home (rooms) and Chats (endpoints) since both follow
// the same "up to 3, each closable/deletable/themeable" shape.
export default function LinkCard({
  item,
  icon,
  kind,
  link,
  activeCount,
  onEnter,
  onToggleStatus,
  onDelete,
  onUpdateSettings,
  children,
}) {
  const copyLink = useCopyLink()
  const showToast = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bannerFile, setBannerFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)

  async function handleToggleStatus() {
    setTogglingStatus(true)
    try {
      await onToggleStatus()
    } finally {
      setTogglingStatus(false)
    }
  }

  async function handleThemeSelect(themeColor) {
    setSavingTheme(true)
    try {
      await onUpdateSettings({ themeColor })
    } finally {
      setSavingTheme(false)
    }
  }

  async function handleConfirmDelete() {
    setConfirmingDelete(false)
    setDeleting(true)
    try {
      await onDelete()
      showToast(`${kind === 'room' ? 'Room' : 'Link'} deleted`, 'success')
      // Success unmounts this card once the owner's list updates — no
      // need to reset `deleting` ourselves, and doing so risks a
      // set-state-after-unmount warning if that update lands first.
    } catch (err) {
      setDeleting(false)
      showToast(err.message, 'error')
    }
  }

  async function handleBannerChange(file) {
    setBannerFile(file)
    if (!file) return
    setUploading(true)
    try {
      const bannerImageUrl = await uploadBanner(kind, item.id, file)
      await onUpdateSettings({ bannerImageUrl })
    } finally {
      setUploading(false)
      setBannerFile(null)
    }
  }

  return (
    <div className="link-card">
      <Card icon={icon} title={item.handle} className={deleting ? 'card--deleting' : ''}>
      {kind === 'room' && (
        <span className={`card__status text-b4 ${item.status === 'open' ? 'card__status--open' : ''}`}>
          <span className="card__status-dot" />
          {item.status === 'open' ? 'Open' : 'Closed'}
          {typeof activeCount === 'number' && ` · ${activeCount} active`}
        </span>
      )}

      <div className="card__actions">
        <button type="button" className="card__pill-btn" onClick={() => copyLink(link)}>
          <CopyIcon />
          Copy link
        </button>
        {onEnter && (
          <button type="button" className="card__pill-btn" onClick={onEnter}>
            <ArrowRightIcon />
            Enter
          </button>
        )}
        {onToggleStatus && (
          <button
            type="button"
            className="card__pill-btn card__pill-btn--icon-only"
            onClick={handleToggleStatus}
            aria-label={item.status === 'open' ? 'Close room' : 'Open room'}
            disabled={togglingStatus}
          >
            {togglingStatus ? <Spinner size={14} /> : <PowerIcon />}
          </button>
        )}
        <button
          type="button"
          className="card__pill-btn card__pill-btn--icon-only"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>
        <button
          type="button"
          className="card__pill-btn card__pill-btn--icon-only"
          onClick={() => setConfirmingDelete(true)}
          aria-label="Delete"
          disabled={deleting}
        >
          <CloseIcon />
        </button>
      </div>

      {children}

      {settingsOpen && (
        <div className="card__expansion">
          <span className="text-b3">Color theme{savingTheme ? ' — saving…' : ''}</span>
          <div className="modal__swatches">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`modal__swatch${item.themeColor === preset.value ? ' modal__swatch--selected' : ''}`}
                style={{ background: preset.value || 'var(--primary)' }}
                onClick={() => handleThemeSelect(preset.value)}
                aria-label={preset.label}
                title={preset.label}
                disabled={savingTheme}
              />
            ))}
          </div>
          <label className="text-b3" htmlFor={`banner-${item.id}`}>
            Banner image (shown when your link is shared)
          </label>
          <FilePicker
            id={`banner-${item.id}`}
            file={bannerFile}
            onChange={handleBannerChange}
            label={uploading ? 'Uploading…' : 'Choose image'}
            disabled={uploading}
            existingLabel={item.bannerImageUrl ? 'Banner set ✓' : undefined}
          />
        </div>
      )}
      </Card>

      {deleting && (
        <div className="link-card__deleting-overlay">
          <Spinner size={24} />
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete this ${kind === 'room' ? 'room' : 'link'}?`}
          message={`"${item.handle}" and everything in it will be permanently deleted. This can't be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
