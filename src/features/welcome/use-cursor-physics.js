import { useEffect } from 'react'

// Floating pieces on /welcome follow the cursor with resistance (a damped
// spring toward a parallax offset, pulled harder when the cursor is near)
// and can be grabbed + dragged with rubber-band resistance, springing back
// on release. Moves elements via the separate CSS `translate` property so
// it stacks with each item's own rotate/bob animation. Off for people who
// prefer reduced motion.
const SELECTOR = '.wl-phys'

export function useCursorPhysics(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const state = { mx: null, my: null, frame: 0 }
    const cleanups = []

    const items = [...root.querySelectorAll(SELECTOR)].map((el, i) => {
      const area = el.offsetWidth * el.offsetHeight
      // small things sit "closer" and move more; big cards are heavier
      const depth = (area < 12000 ? 0.05 : area < 50000 ? 0.035 : 0.024) * (0.85 + (i % 3) * 0.15)
      const item = { el, depth, x: 0, y: 0, vx: 0, vy: 0, grab: null, dragX: undefined, dragY: undefined }

      const down = (e) => {
        e.preventDefault()
        item.grab = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: item.x, oy: item.y }
        el.classList.add('is-grabbed')
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // synthetic pointer — dragging still works without capture
        }
      }
      const move = (e) => {
        if (!item.grab || item.grab.id !== e.pointerId) return
        const rub = (d) => Math.sign(d) * 220 * (1 - Math.exp(-Math.abs(d) / 260))
        item.dragX = item.grab.ox + rub(e.clientX - item.grab.sx)
        item.dragY = item.grab.oy + rub(e.clientY - item.grab.sy)
      }
      const up = () => {
        if (!item.grab) return
        item.grab = null
        item.dragX = item.dragY = undefined
        el.classList.remove('is-grabbed')
      }
      el.addEventListener('pointerdown', down)
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
      cleanups.push(() => {
        el.removeEventListener('pointerdown', down)
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
        el.style.translate = ''
      })
      return item
    })

    const onMove = (e) => {
      if (e.pointerType === 'mouse') {
        state.mx = e.clientX
        state.my = e.clientY
      }
    }
    const onLeave = () => {
      state.mx = state.my = null
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    function step() {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      for (const it of items) {
        let tx = 0
        let ty = 0
        if (it.dragX !== undefined) {
          tx = it.dragX
          ty = it.dragY
        } else if (state.mx !== null) {
          tx = (state.mx - cx) * it.depth
          ty = (state.my - cy) * it.depth
          const r = it.el.getBoundingClientRect()
          const dx = state.mx - (r.left + r.width / 2 - it.x)
          const dy = state.my - (r.top + r.height / 2 - it.y)
          const dist = Math.hypot(dx, dy)
          if (dist < 240) {
            const pull = (1 - dist / 240) * 0.18
            tx += dx * pull
            ty += dy * pull
          }
        }
        // stiffer while dragging (follows the hand), looser + bouncier returning
        const k = it.grab ? 0.32 : 0.07
        const damp = it.grab ? 0.62 : 0.8
        it.vx = (it.vx + (tx - it.x) * k) * damp
        it.vy = (it.vy + (ty - it.y) * k) * damp
        it.x += it.vx
        it.y += it.vy
        it.el.style.translate = `${it.x.toFixed(2)}px ${it.y.toFixed(2)}px`
      }
      state.frame = requestAnimationFrame(step)
    }
    state.frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(state.frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cleanups.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
