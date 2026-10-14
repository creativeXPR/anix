import { useEffect, useRef, useState } from 'react'
import Button from '../../shared/components/Button.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import { useToast } from '../../shared/toast-store.js'
import './stickers.css'

// Sticker maker: any photo → drag to position, slide to zoom, optional
// caption → a 512×512 sticker (rounded, thick white outline, transparent
// corners) exported as WebP (PNG where the browser can't encode WebP).
const OUT = 512
const BORDER = 22
const RADIUS = 96

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawSticker(ctx, img, { zoom, x, y, caption }) {
  ctx.clearRect(0, 0, OUT, OUT)
  // white sticker outline
  roundRect(ctx, 4, 4, OUT - 8, OUT - 8, RADIUS)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  // the photo, cover-fitted, zoomed and panned, inside the outline
  ctx.save()
  roundRect(ctx, BORDER, BORDER, OUT - BORDER * 2, OUT - BORDER * 2, RADIUS - BORDER + 6)
  ctx.clip()
  const box = OUT - BORDER * 2
  const scale = Math.max(box / img.width, box / img.height) * zoom
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, BORDER + (box - w) / 2 + x, BORDER + (box - h) / 2 + y, w, h)
  ctx.restore()
  // caption: chunky white text with a dark outline, near the bottom
  const text = caption.trim()
  if (text) {
    let size = 64
    ctx.font = `800 ${size}px 'Bricolage Grotesque', Poppins, sans-serif`
    while (ctx.measureText(text).width > OUT - 80 && size > 28) {
      size -= 4
      ctx.font = `800 ${size}px 'Bricolage Grotesque', Poppins, sans-serif`
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size / 5
    ctx.strokeStyle = '#120c16'
    ctx.fillStyle = '#ffffff'
    ctx.strokeText(text, OUT / 2, OUT - BORDER - 30)
    ctx.fillText(text, OUT / 2, OUT - BORDER - 30)
  }
}

export default function StickerMaker({ onSave, onClose }) {
  const showToast = useToast()
  const fileRef = useRef(null)
  const canvasRef = useRef(null)
  const drag = useRef(null)
  const [img, setImg] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    fileRef.current?.click()
  }, [])

  useEffect(() => {
    if (!img || !canvasRef.current) return
    drawSticker(canvasRef.current.getContext('2d'), img, { zoom, x: pos.x, y: pos.y, caption })
  }, [img, zoom, pos, caption])

  function pickFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setImg(image)
      setZoom(1)
      setPos({ x: 0, y: 0 })
    }
    image.onerror = () => showToast('Could not open that image', 'error')
    image.src = url
  }

  // drag to reposition (canvas px are 512-wide; the element is smaller)
  function onPointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, start: pos, ratio: OUT / event.currentTarget.getBoundingClientRect().width }
  }
  function onPointerMove(event) {
    const d = drag.current
    if (!d) return
    setPos({ x: d.start.x + (event.clientX - d.x) * d.ratio, y: d.start.y + (event.clientY - d.y) * d.ratio })
  }
  const onPointerUp = () => (drag.current = null)

  async function save(send) {
    if (!img) return
    setBusy(send ? 'send' : 'save')
    try {
      const blob = await new Promise((resolve, reject) =>
        canvasRef.current.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the sticker'))), 'image/webp', 0.86),
      )
      await onSave(blob, send)
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not save the sticker', 'error')
      setBusy(null)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h2>make a sticker</h2>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      {img ? (
        <>
          <canvas
            ref={canvasRef}
            className="sticker-maker__canvas"
            width={OUT}
            height={OUT}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Sticker preview — drag to move the photo"
          />
          <label className="sticker-maker__zoom">
            <span aria-hidden="true">🔍</span>
            <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
          </label>
          <input
            className="field"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 24))}
            placeholder="caption (optional)"
            aria-label="Caption"
          />
          <div className="sticker-maker__actions">
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}>
              Other photo
            </Button>
            <Button type="button" variant="secondary" onClick={() => save(false)} loading={busy === 'save'} disabled={Boolean(busy)}>
              Save
            </Button>
            <Button type="button" onClick={() => save(true)} loading={busy === 'send'} disabled={Boolean(busy)}>
              Save & send
            </Button>
          </div>
          <p className="sticker-maker__note">stickers can be reported — keep it fun, not hurtful.</p>
        </>
      ) : (
        <button type="button" className="sticker-maker__pick" onClick={() => fileRef.current?.click()}>
          <span aria-hidden="true">🖼️</span>
          pick a photo
        </button>
      )}
    </Sheet>
  )
}
