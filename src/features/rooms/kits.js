import { BADGE_GROUPS as FOOTBALL_GROUPS, DEFAULT_BADGES as FOOTBALL_BADGES } from '../football/badges.js'
import { POLL_TEMPLATES as FOOTBALL_POLLS } from '../football/polls.js'

// Room kits (2026-10-14): each room type brings its own identity badges,
// poll templates, sticker pack and wording. 'custom' is the plain room.
// Badge shape everywhere: { id, name, group, colors: [main, second], emoji? }

const series = (group, list) =>
  list.map(([id, name, emoji, a, b]) => ({ id, name, group, emoji, colors: [a, b] }))

const ANIME_BADGES = [
  ...series('Shōnen', [
    ['one-piece', 'One Piece', '🏴‍☠️', '#d32f2f', '#fbc02d'],
    ['naruto', 'Naruto', '🍥', '#f57c00', '#1a237e'],
    ['jjk', 'Jujutsu Kaisen', '🤞', '#4527a0', '#212121'],
    ['demon-slayer', 'Demon Slayer', '🌊', '#00897b', '#212121'],
    ['aot', 'Attack on Titan', '🧱', '#5d4037', '#455a64'],
    ['bleach', 'Bleach', '⚔️', '#212121', '#ef6c00'],
    ['dragon-ball', 'Dragon Ball', '🐉', '#ff6f00', '#1565c0'],
    ['mha', 'My Hero Academia', '💥', '#2e7d32', '#c62828'],
    ['hxh', 'Hunter x Hunter', '🎣', '#2e7d32', '#fdd835'],
    ['chainsaw-man', 'Chainsaw Man', '🪚', '#e65100', '#212121'],
    ['black-clover', 'Black Clover', '🍀', '#1b5e20', '#212121'],
    ['solo-leveling', 'Solo Leveling', '🗡️', '#283593', '#7e57c2'],
    ['dandadan', 'Dandadan', '🛸', '#ad1457', '#00838f'],
    ['kaiju-8', 'Kaiju No. 8', '🦖', '#1565c0', '#455a64'],
  ]),
  ...series('Seinen & more', [
    ['death-note', 'Death Note', '📓', '#212121', '#b71c1c'],
    ['fma', 'Fullmetal Alchemist', '⚗️', '#b71c1c', '#ffd54f'],
    ['frieren', 'Frieren', '🌸', '#90a4ae', '#7cb342'],
    ['vinland-saga', 'Vinland Saga', '⛵', '#5d4037', '#90a4ae'],
    ['berserk', 'Berserk', '🗡️', '#212121', '#b71c1c'],
    ['jojo', "JoJo's Bizarre Adventure", '⭐', '#6a1b9a', '#fdd835'],
    ['tokyo-ghoul', 'Tokyo Ghoul', '🎭', '#212121', '#c62828'],
    ['one-punch-man', 'One Punch Man', '👊', '#fdd835', '#c62828'],
    ['steins-gate', 'Steins;Gate', '⏳', '#4e342e', '#8d6e63'],
  ]),
  ...series('Sports & slice of life', [
    ['haikyuu', 'Haikyuu!!', '🏐', '#ef6c00', '#212121'],
    ['blue-lock', 'Blue Lock', '⚽', '#1565c0', '#212121'],
    ['spy-family', 'Spy x Family', '🥜', '#ec407a', '#424242'],
    ['kaguya', 'Kaguya-sama', '💘', '#ad1457', '#fbc02d'],
    ['your-name', 'Your Name', '☄️', '#1e88e5', '#f06292'],
    ['ghibli', 'Studio Ghibli', '🌳', '#43a047', '#29b6f6'],
  ]),
]

const WEIRD_BADGES = series('Your vibe', [
  ['believer', 'Believer', '👻', '#7b1fd4', '#e1bee7'],
  ['skeptic', 'Skeptic', '🧐', '#455a64', '#b0bec5'],
  ['scaredy', 'Scaredy cat', '😱', '#f9a825', '#212121'],
  ['investigator', 'Investigator', '🕵️', '#5d4037', '#a1887f'],
  ['seen-things', 'Seen things', '💀', '#212121', '#bdbdbd'],
  ['night-owl', '3am thinker', '🌙', '#283593', '#9fa8da'],
  ['abductee', 'Abductee', '🛸', '#00897b', '#80cbc4'],
  ['witchy', 'Witchy', '🔮', '#6a1b9a', '#ce93d8'],
  ['storyteller', 'Storyteller', '🕯️', '#e65100', '#ffcc80'],
  ['clown', 'Just here for chaos', '🤡', '#c62828', '#fdd835'],
])

const ANIME_POLLS = [
  { key: 'versus', label: '⚔️ Who wins?', question: 'Who wins in a fight?', options: ['', ''] },
  { key: 'peak', label: '🔥 Peak or mid?', question: 'Peak fiction or mid?', options: ['Peak 🔥', 'Mid 😐', 'Overrated 🙄'] },
  { key: 'dub', label: '🎙️ Sub or dub?', question: 'Sub or dub?', options: ['Sub', 'Dub', 'Whatever’s out'] },
  { key: 'arc', label: '📚 Best arc?', question: 'Best arc?', options: ['', '', ''] },
  { key: 'custom', label: '✍️ Custom', question: '', options: ['', ''] },
]

const WEIRD_POLLS = [
  { key: 'real', label: '👻 Real or fake?', question: 'Real or fake?', options: ['Real 👻', 'Fake 🤥', 'Need proof 📸'] },
  { key: 'stay', label: '🚪 Would you stay?', question: 'Would you have stayed?', options: ['Stayed 😤', 'Ran 🏃', 'Called a pastor 🙏'] },
  { key: 'level', label: '😨 Creepiness level', question: 'How creepy was that?', options: ['Mild 🙂', 'Chills 😨', 'Sleeping with lights on 💡', 'Moving out 🏠'] },
  { key: 'explain', label: '🧐 Explain it', question: 'What really happened?', options: ['Ghost', 'Coincidence', 'Someone’s lying'] },
  { key: 'custom', label: '✍️ Custom', question: '', options: ['', ''] },
]

export const KITS = {
  custom: {
    label: '💬 Custom',
    hint: 'chat about anything',
    emoji: null,
    badges: null,
  },
  football: {
    label: '⚽ Football',
    hint: 'live match, badges & polls',
    emoji: '⚽',
    badges: FOOTBALL_BADGES,
    badgeGroups: FOOTBALL_GROUPS,
    identityTitle: 'your fan identity',
    identityIntro: 'pick your side — your name takes its colour. nobody can see who you really are.',
    searchPlaceholder: 'Search clubs & countries',
    requestLabel: 'can’t find yours?',
    requestKinds: [
      ['club', '🏟️ Club'],
      ['country', '🌍 Country'],
    ],
    polls: FOOTBALL_POLLS,
    stickerPack: 'football',
    matchCard: true,
  },
  anime: {
    label: '🍥 Anime',
    hint: 'stan badges, polls & stickers',
    emoji: '🍥',
    badges: ANIME_BADGES,
    badgeGroups: ['Shōnen', 'Seinen & more', 'Sports & slice of life'],
    identityTitle: 'your anime identity',
    identityIntro: 'pick the series you stan — your name takes its colour. still fully anonymous.',
    searchPlaceholder: 'Search anime',
    requestLabel: 'your anime isn’t here?',
    requestKinds: [['series', '📺 Anime']],
    polls: ANIME_POLLS,
    stickerPack: 'anime',
    matchCard: false,
  },
  weird: {
    label: '👻 Weird stories',
    hint: 'spill bizarre experiences',
    emoji: '👻',
    badges: WEIRD_BADGES,
    badgeGroups: ['Your vibe'],
    identityTitle: 'your vibe',
    identityIntro: 'how do you take a weird story? pick a vibe — nobody knows it’s you.',
    searchPlaceholder: 'Search vibes',
    requestLabel: 'want another vibe?',
    requestKinds: [['vibe', '✨ Vibe']],
    polls: WEIRD_POLLS,
    stickerPack: 'weird',
    matchCard: false,
  },
}

export const ROOM_TYPE_KEYS = Object.keys(KITS)

export function kitFor(type) {
  return KITS[type] || KITS.custom
}
