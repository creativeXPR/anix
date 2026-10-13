import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, EMOJIS } from './emoji-data.js'

// WhatsApp-style emoji panel: search, category tabs (tap to jump; the
// active tab follows your scroll), recents first, ⌫ to delete.
const RECENT_KEY = 'anix:emoji-recent'
const RECENT_MAX = 24

function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(list) ? list.slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // private mode etc. — recents just won't persist
  }
}

export default function EmojiPanel({ onPick, onBackspace }) {
  const [recent, setRecent] = useState(loadRecent)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(recent.length ? 'recent' : 'smileys')
  const scrollRef = useRef(null)
  const sectionRefs = useRef({})

  const sections = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        items: c.key === 'recent' ? recent.map((e) => ({ e, k: '' })) : EMOJIS[c.key],
      })).filter((s) => s.items.length),
    [recent],
  )

  const needle = search.trim().toLowerCase()
  const results = useMemo(() => {
    if (!needle) return null
    const seen = new Set()
    const out = []
    for (const key of Object.keys(EMOJIS)) {
      for (const item of EMOJIS[key]) {
        if (!seen.has(item.e) && item.k.split(' ').some((word) => word.startsWith(needle))) {
          seen.add(item.e)
          out.push(item)
        }
      }
    }
    return out
  }, [needle])

  // highlight the tab of the section you're looking at
  useEffect(() => {
    const root = scrollRef.current
    if (!root || results) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.dataset.key)
      },
      { root, rootMargin: '0px 0px -70% 0px' },
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [sections, results])

  function pick(emoji) {
    onPick(emoji)
    const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, RECENT_MAX)
    saveRecent(next)
    // don't reshuffle the visible Recent row mid-tap; it updates next open
    if (!recent.length) setRecent(next)
  }

  function jump(key) {
    setSearch('')
    setActive(key)
    requestAnimationFrame(() => {
      const el = sectionRefs.current[key]
      if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 4, behavior: 'smooth' })
    })
  }

  const grid = (items) => (
    <div className="emoji-panel__grid">
      {items.map(({ e, k }) => (
        <button
          key={e}
          type="button"
          className="emoji-panel__emoji"
          onClick={() => pick(e)}
          onMouseDown={(event) => event.preventDefault()}
          aria-label={k ? k.split(' ')[0] : e}
          data-no-lean
        >
          {e}
        </button>
      ))}
    </div>
  )

  return (
    <div className="emoji-panel pop-in" role="dialog" aria-label="Emojis">
      <div className="emoji-panel__top">
        <input
          className="emoji-panel__search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
        />
        <button
          type="button"
          className="emoji-panel__backspace"
          onClick={onBackspace}
          onMouseDown={(event) => event.preventDefault()}
          aria-label="Delete"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.5 5.5h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11L2.5 12z" />
            <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" />
          </svg>
        </button>
      </div>

      <div className="emoji-panel__tabs" role="tablist" aria-label="Emoji categories">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={!results && active === s.key}
            aria-label={s.label}
            title={s.label}
            onClick={() => jump(s.key)}
            onMouseDown={(event) => event.preventDefault()}
            data-no-lean
          >
            {s.icon}
          </button>
        ))}
      </div>

      <div className="emoji-panel__scroll" ref={scrollRef}>
        {results ? (
          results.length ? (
            grid(results)
          ) : (
            <p className="emoji-panel__empty">no emoji for “{search.trim()}” 🤷</p>
          )
        ) : (
          sections.map((s) => (
            <section key={s.key} data-key={s.key} ref={(el) => (sectionRefs.current[s.key] = el)}>
              <h4>{s.label}</h4>
              {grid(s.items)}
            </section>
          ))
        )}
      </div>
    </div>
  )
}
