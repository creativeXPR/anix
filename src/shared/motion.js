// App-wide bouncy interactions (see motion.css). One set of document
// listeners — no per-component wiring, so every widget, present and
// future, gets the same feel.
const INTERACTIVE = [
  'button',
  'a[href]',
  'summary',
  'select',
  'label[for]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="option"]',
  '[role="menuitem"]',
].join(',')

function target(event) {
  const el = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null
  if (!el || el.matches(':disabled, [aria-disabled="true"]') || el.closest('[data-no-bounce]')) return null
  return el
}

function boing(el) {
  el.classList.remove('m-boing')
  // restart the animation if it's tapped again mid-boing
  void el.offsetWidth
  el.classList.add('m-boing')
}

// ---- hover lean: small controls drift toward the cursor (damped spring,
// like the welcome page's floaters), and spring back when it leaves ----
const MAX_LEAN = 4 // px
const springs = new Map() // el → { x, y, vx, vy, tx, ty }
let frame = 0

function tick() {
  for (const [el, s] of springs) {
    s.vx = (s.vx + (s.tx - s.x) * 0.18) * 0.72
    s.vy = (s.vy + (s.ty - s.y) * 0.18) * 0.72
    s.x += s.vx
    s.y += s.vy
    const settled = Math.abs(s.x - s.tx) < 0.05 && Math.abs(s.y - s.ty) < 0.05 && Math.abs(s.vx) + Math.abs(s.vy) < 0.05
    if (settled && s.tx === 0 && s.ty === 0) {
      el.style.translate = ''
      springs.delete(el)
    } else {
      el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`
    }
  }
  frame = springs.size ? requestAnimationFrame(tick) : 0
}

function leanable(el) {
  // only compact controls — full-width rows/cards leaning looks broken
  if (el.closest('.wl-phys, [data-no-lean]')) return false
  const r = el.getBoundingClientRect()
  return r.width <= 220 && r.height <= 72
}

function lean(el, event) {
  const r = el.getBoundingClientRect()
  const nx = (event.clientX - (r.left + r.width / 2)) / (r.width / 2)
  const ny = (event.clientY - (r.top + r.height / 2)) / (r.height / 2)
  const s = springs.get(el) || { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }
  s.tx = Math.max(-1, Math.min(1, nx)) * MAX_LEAN
  s.ty = Math.max(-1, Math.min(1, ny)) * MAX_LEAN * 0.6
  springs.set(el, s)
  if (!frame) frame = requestAnimationFrame(tick)
}

function release(el) {
  const s = springs.get(el)
  if (!s) return
  s.tx = 0
  s.ty = 0
  if (!frame) frame = requestAnimationFrame(tick)
}

export function initMotion() {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let pressed = null
  document.addEventListener(
    'pointerdown',
    (event) => {
      pressed = target(event)
    },
    { passive: true },
  )
  const up = () => {
    if (pressed) boing(pressed)
    pressed = null
  }
  document.addEventListener('pointerup', up, { passive: true })
  document.addEventListener('pointercancel', up, { passive: true })

  // keyboard activation (Enter / Space) fires click with detail 0
  document.addEventListener('click', (event) => {
    if (event.detail === 0) {
      const el = target(event)
      if (el) boing(el)
    }
  })

  document.addEventListener('animationend', (event) => {
    if (event.animationName === 'm-boing') event.target.classList.remove('m-boing')
  })

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  let hovered = null
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return
      const el = target(event)
      const next = el && leanable(el) ? el : null
      if (hovered && hovered !== next) release(hovered)
      hovered = next
      if (next) lean(next, event)
    },
    { passive: true },
  )
  document.addEventListener('mouseleave', () => {
    if (hovered) release(hovered)
    hovered = null
  })
}
