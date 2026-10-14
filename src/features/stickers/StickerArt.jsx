import { findBuiltIn } from './packs.js'
import './stickers.css'

// Renders a sticker: a built-in one (`{ pack, id }`, drawn from emoji +
// caption) or an uploaded one (`{ url }`). The white outline + shadow is
// the same for both, so they read as one family.
export default function StickerArt({ sticker, size = 120 }) {
  if (sticker?.url) {
    return <img className="sticker-art sticker-art--image" src={sticker.url} alt="sticker" width={size} height={size} loading="lazy" />
  }
  const def = findBuiltIn(sticker?.pack, sticker?.id)
  if (!def) return <span className="sticker-art sticker-art--missing" style={{ width: size, height: size }} aria-label="sticker" />
  return (
    <span className="sticker-art" style={{ width: size, height: size, '--sticker-color': def.color, fontSize: size }} role="img" aria-label={def.caption}>
      <span className="sticker-art__emoji">{def.emoji}</span>
      <span className="sticker-art__caption">{def.caption}</span>
    </span>
  )
}
