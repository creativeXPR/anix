import { useState } from 'react'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import { useToast } from '../../shared/toast-store.js'
import { uploadSticker, useMyStickers } from './my-stickers.js'
import { PACK_KEYS, PACKS, roomPack } from './packs.js'
import StickerArt from './StickerArt.jsx'
import StickerMaker from './StickerMaker.jsx'
import './stickers.css'

// The Stickers side of a room's emoji panel: the room's pack first (by
// room type, or the owner's pick), the other pack, then ⭐ mine — with
// "+ make" (the sticker maker). Tapping a sticker sends it.
export default function StickerTray({ room, onSend }) {
  const showToast = useToast()
  const mine = useMyStickers()
  const first = roomPack(room)
  const tabs = [first, ...PACK_KEYS.filter((k) => k !== first), 'mine']
  const [tab, setTab] = useState(first)
  const [making, setMaking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(null)

  async function saveMade(blob, send) {
    const url = await uploadSticker(blob, mine.uid)
    await mine.add({ url })
    setTab('mine')
    if (send) onSend({ url })
    else showToast('Sticker saved ⭐', 'success')
  }

  return (
    <div className="sticker-tray">
      <div className="sticker-tray__tabs" role="tablist" aria-label="Sticker packs">
        {tabs.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
            {key === 'mine' ? '⭐ Mine' : PACKS[key].label}
          </button>
        ))}
      </div>
      <div className="sticker-tray__grid">
        {tab === 'mine' ? (
          <>
            <button type="button" className="sticker-tray__make" onClick={() => setMaking(true)}>
              <span aria-hidden="true">＋</span>
              make
            </button>
            {mine.stickers.map((s) => (
              <span key={s.id} className="sticker-tray__cell">
                <button type="button" className="sticker-tray__item" onClick={() => (editing ? setRemoving(s) : onSend(s.sticker))} aria-label={editing ? 'Remove sticker' : 'Send sticker'}>
                  <StickerArt sticker={s.sticker} size={72} />
                </button>
                {editing && (
                  <span className="sticker-tray__x" aria-hidden="true">
                    ✕
                  </span>
                )}
              </span>
            ))}
          </>
        ) : (
          PACKS[tab].stickers.map(([id]) => (
            <button key={id} type="button" className="sticker-tray__item" onClick={() => onSend({ pack: tab, id })} aria-label="Send sticker">
              <StickerArt sticker={{ pack: tab, id }} size={72} />
            </button>
          ))
        )}
      </div>
      {tab === 'mine' && mine.stickers.length > 0 && (
        <button type="button" className="sticker-tray__edit" onClick={() => setEditing((v) => !v)}>
          {editing ? 'done' : 'remove some'}
        </button>
      )}
      {tab === 'mine' && !mine.uid && mine.stickers.length > 0 && (
        <p className="sticker-tray__note">saved in this browser — sign in and they move to your account.</p>
      )}

      {making && <StickerMaker onSave={saveMade} onClose={() => setMaking(false)} />}
      {removing && (
        <ConfirmDialog
          title="remove this sticker?"
          message="It leaves your stickers. Anything already sent stays in the chat."
          confirmLabel="Remove"
          onConfirm={async () => {
            const target = removing
            setRemoving(null)
            await mine.remove(target.id)
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  )
}
