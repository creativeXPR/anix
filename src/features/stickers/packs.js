// Built-in sticker packs (2026-10-14). Original, drawn in code (emoji +
// caption with a white sticker outline — StickerArt.jsx), so they cost no
// storage and send as a tiny `{ pack, id }`. No real players or crests.
export const PACKS = {
  football: {
    label: '⚽ Football',
    color: '#16a34a',
    stickers: [
      ['goal', '⚽', 'GOAL!'],
      ['var', '📺', 'VAR CHECK'],
      ['offside', '🚩', 'OFFSIDE'],
      ['red', '🟥', 'RED CARD'],
      ['penalty', '🎯', 'PENALTY!'],
      ['strike', '🔥', 'what a strike'],
      ['blind', '🙈', 'ref is blind'],
      ['bus', '🚌', 'park the bus'],
      ['bottled', '🤡', 'bottled it'],
      ['champions', '🏆', 'champions'],
      ['goat', '🐐', 'GOAT'],
      ['wemove', '😭', 'we move'],
      ['siuu', '🗣️', 'SIUUU'],
      ['drama', '🍿', 'drama loading'],
      ['cooked', '🍳', 'cooked'],
      ['ft', '🏁', 'full time'],
    ],
  },
  general: {
    label: '✨ General',
    color: '#7b1fd4',
    stickers: [
      ['dead', '💀', "I'm dead"],
      ['spill', '👀', 'spill'],
      ['tea', '🍵', 'the tea'],
      ['noway', '😭', 'no way'],
      ['facts', '💯', 'facts'],
      ['surejan', '🙄', 'sure jan'],
      ['hmm', '🤔', 'hmm…'],
      ['lmao', '😂', 'LMAOOO'],
      ['pls', '🥺', 'pls'],
      ['letsgo', '🎉', "let's go"],
      ['unbothered', '💅', 'unbothered'],
      ['redflag', '🚩', 'red flag'],
      ['boring', '😴', 'boring'],
      ['mindblown', '🤯', 'mind blown'],
      ['respect', '🤝', 'respect'],
      ['love', '💜', 'love this'],
    ],
  },
}

export const PACK_KEYS = Object.keys(PACKS)

// Which pack a room shows first: the owner's pick, else by room type.
export function roomPack(room) {
  const pick = room?.stickerPack
  if (pick && PACKS[pick]) return pick
  return room?.type === 'football' ? 'football' : 'general'
}

export function findBuiltIn(pack, id) {
  const row = PACKS[pack]?.stickers.find(([key]) => key === id)
  return row ? { pack, id, emoji: row[1], caption: row[2], color: PACKS[pack].color } : null
}
