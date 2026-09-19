const URL_PATTERN = /https?:\/\/[^\s]+/g

// Splits message text into plain-text and link segments. Renders a
// hostname-only "preview" chip rather than fetching OG metadata — a real
// unfurl needs a server-side fetch (CORS) that Anix doesn't have yet.
export function splitTextAndLinks(text) {
  const segments = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0]
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'link', value: url })
    lastIndex = match.index + url.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

export function hostnameFor(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
