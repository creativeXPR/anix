import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Sheet.css'

const CLOSE_DISTANCE = 110 // px dragged down before release closes it
const CLOSE_SPEED = 0.7 // px/ms — a quick flick closes it regardless
const EXIT_MS = 240

// Bottom sheet (centered card ≥600px) — the one overlay pattern since the
// NGL redesign, replacing the old centered .modal. Closes on: drag down
// from the grabber (touch; touch-action:none keeps the browser from
// scrolling instead) or from any empty area with a mouse, a flick,
// backdrop tap, or Escape. Portaled to <body> so a ConfirmDialog opened
// from inside another sheet stacks on top of it (later DOM order wins).
// `as="form"` + onSubmit for sheets that are forms.
export default function Sheet({ onClose, children, as: Tag = 'div', className = '', role = 'dialog', ...props }) {
  const sheetRef = useRef(null)
  const scrimRef = useRef(null)
  const dragRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  function requestClose() {
    if (closing) return
    setClosing(true)
    setTimeout(() => onCloseRef.current?.(), EXIT_MS)
  }

  useEffect(() => {
    function onKey(event) {
      // Only the top-most sheet reacts, so Escape on a stacked confirm
      // doesn't also close the sheet underneath it.
      const scrims = document.querySelectorAll('.sheet-scrim')
      if (event.key === 'Escape' && scrims[scrims.length - 1] === scrimRef.current) {
        setClosing(true)
        setTimeout(() => onCloseRef.current?.(), EXIT_MS)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handlePointerDown(event) {
    const sheet = sheetRef.current
    const onHandle = event.target.closest('.sheet__grabber')
    const mouseOnEmpty =
      event.pointerType === 'mouse' &&
      sheet.scrollTop === 0 &&
      !event.target.closest('input, textarea, select, button, label, a, [data-no-drag]')
    if (!onHandle && !mouseOnEmpty) return
    dragRef.current = { startY: event.clientY, t0: performance.now(), dy: 0 }
    sheet.style.animation = 'none'
    sheet.style.transition = 'none'
    sheet.classList.add('sheet--dragging')
    try {
      sheet.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic/stale pointer — dragging still works without capture.
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const raw = event.clientY - drag.startY
    drag.dy = raw > 0 ? raw : raw / 6 // a little rubber-band when pulled up
    sheetRef.current.style.transform = `translateY(${drag.dy}px)`
    scrimRef.current.style.setProperty('--scrim-alpha', String(0.55 * Math.max(0, 1 - Math.max(drag.dy, 0) / 400)))
  }

  function handlePointerUp() {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const sheet = sheetRef.current
    const speed = drag.dy / (performance.now() - drag.t0)
    sheet.classList.remove('sheet--dragging')
    if (drag.dy > CLOSE_DISTANCE || speed > CLOSE_SPEED) {
      sheet.style.transition = `transform ${EXIT_MS}ms cubic-bezier(.2, .8, .2, 1)`
      sheet.style.transform = 'translateY(110%)'
      scrimRef.current.style.setProperty('--scrim-alpha', '0')
      setTimeout(() => onCloseRef.current?.(), EXIT_MS)
    } else {
      sheet.style.transition = 'transform .4s var(--ease-bounce)'
      sheet.style.transform = ''
      scrimRef.current.style.removeProperty('--scrim-alpha')
    }
  }

  return createPortal(
    <div
      ref={scrimRef}
      className={`sheet-scrim${closing ? ' sheet-scrim--closing' : ''}`}
      onClick={(event) => {
        if (event.target === scrimRef.current) requestClose()
      }}
    >
      <Tag
        ref={sheetRef}
        className={`sheet${closing ? ' sheet--closing' : ''} ${className}`.trim()}
        role={role}
        aria-modal="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...props}
      >
        <div className="sheet__grabber" aria-hidden="true" />
        {children}
      </Tag>
    </div>,
    document.body,
  )
}
