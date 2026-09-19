// Curated so no two adjacent hues are easily confused. Revisit once Anix
// has a real accent color (#003) — exclude it here the way Anime-space's
// palette excludes crimson/gold.
const PALETTE = [
  '#e07a5f',
  '#3d8bfd',
  '#43aa8b',
  '#e0a327',
  '#9b5de5',
  '#f15bb5',
  '#00b4d8',
  '#84a98c',
  '#f3722c',
]

// Same id always maps to the same color for the room's duration — a plain
// string hash, not cryptographic, just needs to be stable and well spread.
export function colorForParticipant(participantId) {
  let hash = 0
  for (let i = 0; i < participantId.length; i++) {
    hash = (hash << 5) - hash + participantId.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
