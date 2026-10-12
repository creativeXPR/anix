// The two-stop gradient behind an anonymous message's header strip (and
// the share image's background) — NGL's two-tone sweep, generalized:
// the second stop is the endpoint's theme color with its hue rotated
// forward and lightened a touch, so any preset (blue→violet,
// green→teal, …) gets the same "warm sweep" instead of a flat block.
// Computed in JS rather than CSS relative-color syntax because the
// canvas share image needs real hex values too.
// Brand purple (app icon). Rotated +35° it lands on orchid ≈ --grad-to.
const DEFAULT_COLOR = '#7b1fd4'

const HUE_SHIFT = 35
const LIGHTEN = 6

function hexToHsl(hex) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

// The default is pinned to the exact brand pair (--grad-from/--grad-to in
// index.css) rather than computed, so default cards match the app chrome.
const DEFAULT_TO = '#d23fc0'

export function messageGradient(themeColor) {
  if (!themeColor || themeColor.toLowerCase() === DEFAULT_COLOR) return { from: DEFAULT_COLOR, to: DEFAULT_TO }
  const from = themeColor
  const [h, s, l] = hexToHsl(from)
  const to = hslToHex((h + HUE_SHIFT) % 360, s, Math.min(l + LIGHTEN, 72))
  return { from, to }
}

// For inline `style` — components read these as --msg-from / --msg-to.
export function messageGradientVars(themeColor) {
  const { from, to } = messageGradient(themeColor)
  return { '--msg-from': from, '--msg-to': to }
}

// A theme swatch shows the same two-tone gradient the link/room will use.
export function swatchStyle(themeColor) {
  const { from, to } = messageGradient(themeColor)
  return { background: `linear-gradient(135deg, ${from}, ${to})` }
}
