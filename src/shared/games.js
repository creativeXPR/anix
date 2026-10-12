// Prompt games for anonymous-message links (NGL redesign, step 3).
//
// An endpoint stores `game` (a key below) and `prompt` (the resolved text
// visitors see: the game's own prompt, or the owner's words for
// `custom`). Storing the resolved text means the linkPreview Cloud
// Function and older clients can show it without knowing this list.
// Each sent message snapshots `game` + `prompt` too, so changing a link's
// game later doesn't relabel messages already received.
//
// `colors` is the game's own gradient (card header / link band, like
// NGL's per-game cards); the link's vibe (themeColor) still colors the
// sender page. `loud` = NGL's outlined-caps logotype treatment.
export const GAMES = {
  ama: {
    title: 'ask me anything',
    prompt: 'ask me anything!',
    colors: ['#7b1fd4', '#d23fc0'],
    dice: [
      "what's your toxic trait?",
      'what are you lowkey obsessed with rn?',
      'who was your first crush?',
      "what's the last lie you told?",
      "what's something you've never told anyone?",
      'what would you do with a million dollars?',
    ],
  },
  tbh: {
    title: 'tbh',
    prompt: "send me anonymous tbh's",
    colors: ['#ff3f5e', '#ff6bd6'],
    dice: [
      "tbh you're way funnier than you think",
      'tbh i love your laugh haha',
      'tbh your fits are always fire',
      'tbh i wish we talked more',
      'tbh you give the best advice',
    ],
  },
  words: {
    title: '3 words',
    prompt: 'describe me in 3 words',
    colors: ['#ff1a4b', '#c4002b'],
    loud: true,
    dice: ['smart, funny, lit', 'kind, chaotic, iconic', 'loud, loyal, legend', 'calm, cute, clever', 'brave, weird, wonderful'],
  },
  nhie: {
    title: 'never have i ever',
    prompt: 'never have i ever…',
    colors: ['#5a1aa8', '#8a2be2'],
    loud: true,
    dice: [
      'facetuned my social media pics',
      "stalked my ex's new partner",
      'pretended to be sick to skip',
      'cried at a disney movie',
      'sent a text to the wrong person',
    ],
  },
  confess: {
    title: 'confessions',
    prompt: 'send me your confessions',
    colors: ['#ff7a2f', '#ffb340'],
    dice: [
      'i still have your hoodie',
      'i used to copy your homework',
      'i had a crush on you last year',
      'i never watched the show i said i finished',
    ],
  },
  deal: {
    title: 'dealbreaker',
    prompt: "what's my dealbreaker?",
    colors: ['#b03ad8', '#5b2bd9'],
    loud: true,
    dice: ["they don't like marvel movies", 'they chew loudly', "they don't text back", 'they hate dogs'],
  },
  cancelled: {
    title: 'cancelled',
    prompt: "share an opinion that'd get you cancelled",
    colors: ['#2a7fa8', '#16c9e0'],
    loud: true,
    dice: ["'the office' is so overrated", 'pineapple on pizza is elite', 'cereal is a soup', 'sleeping in socks is valid'],
  },
  custom: {
    title: 'custom',
    prompt: '',
    colors: ['#111111', '#3a3a3a'],
    dice: ['say something nice 🫶', 'tell me a secret', 'rate me 1-10', 'be honest…'],
  },
}

// Links created before games existed have no `game`: they read as this.
export const DEFAULT_GAME = 'ama'
// Shown for links/messages from before games existed (no stored prompt).
export const LEGACY_PROMPT = 'send me anonymous messages!'
export const CUSTOM_PROMPT_MAX = 80

export function gameOf(key) {
  return GAMES[key] || GAMES[DEFAULT_GAME]
}

// The text a visitor sees for an endpoint or a received message.
export function promptOf(item) {
  if (item?.prompt) return item.prompt
  if (item?.game && GAMES[item.game]?.prompt) return GAMES[item.game].prompt
  return LEGACY_PROMPT
}

// The header label on a card: the game's title, or for custom games the
// owner's own prompt (a "custom" label would mean nothing to anyone).
export function headerOf(item) {
  if (!item?.game) return item?.prompt || LEGACY_PROMPT
  if (item.game === 'custom') return item.prompt || 'custom'
  return gameOf(item.game).title
}

export function gameGradientVars(key) {
  const [from, to] = gameOf(key).colors
  return { '--g1': from, '--g2': to }
}

export function randomDice(key, current) {
  const pool = gameOf(key).dice
  if (pool.length < 2) return pool[0]
  let next = current
  while (next === current) next = pool[Math.floor(Math.random() * pool.length)]
  return next
}
