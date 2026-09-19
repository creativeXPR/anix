function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const MORNING = [
  { text: 'Good morning', emoji: '🌞' },
  { text: 'Rise and shine', emoji: '☀️' },
]
const AFTERNOON = [
  { text: 'Good afternoon', emoji: '👋' },
  { text: 'Hey there', emoji: '😊' },
]
const EVENING = [
  { text: 'Good evening', emoji: '🌆' },
  { text: 'Welcome back', emoji: '✨' },
]
const NIGHT = [
  { text: 'Still up?', emoji: '🌙' },
  { text: 'Night owl', emoji: '⭐' },
]

// Home: a time-of-day greeting, re-rolled (within its bucket) each visit.
export function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return pick(NIGHT)
  if (hour < 12) return pick(MORNING)
  if (hour < 17) return pick(AFTERNOON)
  if (hour < 21) return pick(EVENING)
  return pick(NIGHT)
}

const PROFILE_PROMPTS = [
  { text: 'Care to give some feedback?', emoji: '💬' },
  { text: 'Fancy changing your theme?', emoji: '🎨' },
  { text: 'Everything looking good so far?', emoji: '✨' },
]

// Profile: prompts toward the two things this screen actually lets you
// do (feedback, theme) — not time-of-day, since there's nothing
// time-sensitive to say here.
export function getProfilePrompt() {
  return pick(PROFILE_PROMPTS)
}

const CHATS_WITH_MESSAGES = [
  { text: "You've got new whispers", emoji: '🤫' },
  { text: 'People have been talking', emoji: '💌' },
  { text: 'Someone reached out', emoji: '📬' },
]
const CHATS_EMPTY = [
  { text: "It's quiet in here", emoji: '🦗' },
  { text: 'Nothing yet — share your link', emoji: '📭' },
  { text: 'Waiting on your first message', emoji: '👀' },
]

// Chats: has to know whether there's actually anything in the inbox —
// a "you've got mail" line when the inbox is empty would read as a bug,
// not a feature.
export function getChatsPrompt(hasMessages) {
  return pick(hasMessages ? CHATS_WITH_MESSAGES : CHATS_EMPTY)
}
