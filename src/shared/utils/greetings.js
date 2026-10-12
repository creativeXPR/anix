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
