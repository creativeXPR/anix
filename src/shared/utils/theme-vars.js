// A per-room/per-endpoint themeColor used to only override --primary,
// which only reached --accent-based elements (buttons, the own-message
// bubble, the nav pill) — hover backgrounds, panel/card surfaces, and
// borders all stayed on the fixed dark-purple palette regardless of
// theme. This derives the *whole* surface ladder from the one color
// instead, via color-mix() against the same near-black base every
// themed surface already uses, so hover/bg/border/bubble all shift
// together.
const BASE = '#0a0611'

export function themeStyleVars(themeColor) {
  if (!themeColor) return undefined

  return {
    '--primary': themeColor,
    // --primary-light/-dark matter here too, not just --primary itself —
    // Button's hover/active states read --primary-dark specifically
    // (see Button.css), which stayed the fixed default violet regardless
    // of theme until this was added, so the send button's hover looked
    // visibly unrelated to whatever color the room/link was actually
    // themed. Approximated via color-mix rather than the precise HSL
    // ramp the base palette uses (index.css) — good enough for an
    // arbitrary preset color, and consistent with how every other token
    // here is derived.
    '--primary-light': `color-mix(in srgb, ${themeColor} 60%, white)`,
    '--primary-dark': `color-mix(in srgb, ${themeColor} 70%, black)`,
    '--bg': `color-mix(in srgb, ${themeColor} 8%, ${BASE})`,
    '--panel': `color-mix(in srgb, ${themeColor} 16%, ${BASE})`,
    '--panel-alt': `color-mix(in srgb, ${themeColor} 24%, ${BASE})`,
    '--border': `color-mix(in srgb, ${themeColor} 36%, ${BASE})`,
    '--text': '#f3edf7',
    '--text-h': '#ffffff',
    '--text-muted': '#c9bfce',
  }
}
