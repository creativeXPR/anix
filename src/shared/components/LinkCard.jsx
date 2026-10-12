import { useState } from 'react'
import { Link } from 'react-router-dom'
import { gameGradientVars, gameOf, headerOf } from '../games.js'
import { DEFAULT_ROOM_EMOJI } from '../room-defaults.js'
import { messageGradientVars } from '../utils/message-gradient.js'
import { useCopyLink } from '../hooks/use-copy-link.js'
import { useToast } from '../toast-store.js'
import ChevronRightIcon from '../icons/ChevronRightIcon.jsx'
import CopyIcon from '../icons/CopyIcon.jsx'
import LockIcon from '../icons/LockIcon.jsx'
import SettingsIcon from '../icons/SettingsIcon.jsx'
import TrashIcon from '../icons/TrashIcon.jsx'
import UnlockIcon from '../icons/UnlockIcon.jsx'
import Button from './Button.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import ItemSettingsSheet from './ItemSettingsSheet.jsx'
import Spinner from './Spinner.jsx'
import './LinkCard.css'

// One room or one message-endpoint on Home (NGL redesign): a white card
// tinted by the item's theme gradient. Links get a gradient band on top;
// rooms get a tappable "enter" row. Both share the action row (Copy link
// / [open-close] / settings / delete) and the settings sheet.
export default function LinkCard({
  item,
  kind,
  link,
  enterTo,
  activeCount,
  unreadCount = 0,
  onToggleStatus,
  onDelete,
  onUpdateSettings,
}) {
  const copyLink = useCopyLink()
  const showToast = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const isRoom = kind === 'room'
  const isOpen = item.status === 'open'

  async function handleToggleStatus() {
    setTogglingStatus(true)
    try {
      await onToggleStatus()
      showToast(isOpen ? 'Room closed 🔒' : 'Room is open 🟢', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setTogglingStatus(false)
    }
  }

  async function handleConfirmDelete() {
    setConfirmingDelete(false)
    setSettingsOpen(false)
    setDeleting(true)
    try {
      await onDelete()
      showToast(`${isRoom ? 'Room' : 'Link'} deleted`, 'success')
      // Success unmounts this card once the owner's list updates — no
      // need to reset `deleting` ourselves, and doing so risks a
      // set-state-after-unmount warning if that update lands first.
    } catch (err) {
      setDeleting(false)
      showToast(err.message, 'error')
    }
  }

  const avatar = item.bannerImageUrl ? (
    <img className="link-card__avatar" src={item.bannerImageUrl} alt="" />
  ) : isRoom ? (
    <span className="link-card__avatar link-card__avatar--emoji">{item.emoji || DEFAULT_ROOM_EMOJI}</span>
  ) : (
    <img className="link-card__avatar" src="/icon.svg" alt="" />
  )

  return (
    <article
      className={`link-card pop-in${deleting ? ' link-card--deleting' : ''}`}
      style={messageGradientVars(item.themeColor)}
    >
      {isRoom ? (
        <Link className="link-card__enter" to={enterTo} aria-label={`Enter ${item.handle}`}>
          {avatar}
          <div className="link-card__id">
            <b>{item.handle}</b>
            <small>
              {activeCount > 0 ? (
                <span className="link-card__live">
                  <i />
                  {activeCount} inside now
                </span>
              ) : (
                'nobody inside — share the link'
              )}
            </small>
          </div>
          <span className={`link-card__status${isOpen ? ' link-card__status--open' : ''}`}>{isOpen ? 'open' : 'closed'}</span>
          <ChevronRightIcon className="link-card__chev" />
        </Link>
      ) : (
        <>
          {/* The link's game, as an NGL card band, + sealed-message count. */}
          <div className="link-card__band" style={gameGradientVars(item.game)}>
            <span className={`game-title${item.game && gameOf(item.game).loud ? ' game-title--loud' : ''}`}>
              {headerOf(item)}
            </span>
            {unreadCount > 0 && <span className="link-card__new">{unreadCount} new 👀</span>}
          </div>
          <div className="link-card__row">
            {avatar}
            <div className="link-card__id">
              <b>@{item.handle}</b>
              <small>{link.replace(/^https?:\/\//, '')}</small>
            </div>
          </div>
        </>
      )}

      <div className="link-card__actions">
        <Button size="sm" className="link-card__copy" onClick={() => copyLink(link)}>
          <CopyIcon />
          Copy link
        </Button>
        {isRoom && (
          <button
            type="button"
            className="icon-btn"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            aria-label={isOpen ? 'Close room' : 'Open room'}
            title={isOpen ? 'Close room' : 'Open room'}
          >
            {togglingStatus ? <Spinner size={16} /> : isOpen ? <UnlockIcon /> : <LockIcon />}
          </button>
        )}
        <button type="button" className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <SettingsIcon />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setConfirmingDelete(true)}
          disabled={deleting}
          aria-label="Delete"
        >
          {deleting ? <Spinner size={16} /> : <TrashIcon />}
        </button>
      </div>

      {settingsOpen && (
        <ItemSettingsSheet
          item={item}
          kind={kind}
          onUpdateSettings={onUpdateSettings}
          onToggleStatus={isRoom ? handleToggleStatus : null}
          togglingStatus={togglingStatus}
          onDelete={() => setConfirmingDelete(true)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`delete this ${isRoom ? 'room' : 'link'}?`}
          message={`"${item.handle}" and everything in it will be permanently deleted. This can't be undone.`}
          confirmLabel={isRoom ? 'Delete room' : 'Delete link'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </article>
  )
}
