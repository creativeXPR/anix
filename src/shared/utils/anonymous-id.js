// Excludes 0/O/1/I so a displayed id is never ambiguous when read aloud or typed back in.
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(length) {
  let id = ''
  for (let i = 0; i < length; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return id
}

export function generateAnonymousId(length = 6) {
  return randomCode(length)
}
