// In-app notification "pop" (2026-10-12). Synthesized with Web Audio — no
// audio file to download, plays instantly. Browsers only allow audio after
// the user has interacted with the page once, so the AudioContext is
// created/resumed on the first tap/keypress; pops before that are skipped
// silently (nothing to hear yet anyway on a fresh load).
//
// Out-of-app (push) notifications can't use this: browsers don't let web
// notifications choose a sound, so those play the OS's default sound
// (plus a vibration pattern on Android, see public/sw.js).

const STORAGE_KEY = 'anix:sounds'
const MIN_GAP_MS = 400 // a burst of arrivals = one pop, not a machine gun

let context = null
let lastPopAt = 0

function getContext() {
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    context = new AudioContextClass()
  }
  return context
}

// Unlock audio on the first real interaction.
if (typeof window !== 'undefined') {
  const unlock = () => {
    getContext()?.resume?.()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

export function soundsEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundsEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // not persisted — fine
  }
  if (enabled) playPop()
}

// A bubbly two-part pop: a quick sine "blip" whose pitch drops, layered
// with a tiny higher sparkle — short (≈0.18s) and soft.
export function playPop() {
  if (!soundsEnabled()) return
  const ctx = getContext()
  if (!ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  if (performance.now() - lastPopAt < MIN_GAP_MS) return
  lastPopAt = performance.now()

  const master = ctx.createGain()
  master.gain.value = 0.22
  master.connect(ctx.destination)

  const blip = ctx.createOscillator()
  const blipGain = ctx.createGain()
  blip.type = 'sine'
  blip.frequency.setValueAtTime(880, now)
  blip.frequency.exponentialRampToValueAtTime(320, now + 0.12)
  blipGain.gain.setValueAtTime(0.0001, now)
  blipGain.gain.exponentialRampToValueAtTime(1, now + 0.008)
  blipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
  blip.connect(blipGain).connect(master)
  blip.start(now)
  blip.stop(now + 0.18)

  const sparkle = ctx.createOscillator()
  const sparkleGain = ctx.createGain()
  sparkle.type = 'triangle'
  sparkle.frequency.setValueAtTime(1760, now + 0.03)
  sparkleGain.gain.setValueAtTime(0.0001, now + 0.03)
  sparkleGain.gain.exponentialRampToValueAtTime(0.35, now + 0.04)
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
  sparkle.connect(sparkleGain).connect(master)
  sparkle.start(now + 0.03)
  sparkle.stop(now + 0.12)
}
