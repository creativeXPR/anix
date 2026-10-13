import { useMemo, useState } from 'react'
import Button from '../../shared/components/Button.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import { useToast } from '../../shared/toast-store.js'
import { BADGE_GROUPS, badgeNameColor, badgeSnapshot } from './badges.js'
import BadgeChip from './BadgeChip.jsx'
import { requestBadge, useBadgeCatalog } from './football-data.js'
import './football.css'

// "Your fan identity" in a football room: pick a club/country badge from
// the catalogue — your name shows in its colour with the badge beside it.
// Same for everyone, owner included (nothing marks the room's owner).
// Can't find yours? Request it → /admin → Badges.
export function IdentityPicker({ participantId, badge, onChange }) {
  const catalog = useBadgeCatalog()
  const [search, setSearch] = useState('')
  const [requesting, setRequesting] = useState(false)

  const needle = search.trim().toLowerCase()
  const groups = useMemo(() => {
    const order = [...BADGE_GROUPS, ...new Set(catalog.map((b) => b.group).filter((g) => !BADGE_GROUPS.includes(g)))]
    return order
      .map((group) => ({
        group,
        items: catalog.filter((b) => b.group === group && (!needle || b.name.toLowerCase().includes(needle))),
      }))
      .filter((g) => g.items.length)
  }, [catalog, needle])

  return (
    <div className="identity">
      <div className="identity__preview">
        <small>how you show up</small>
        <span className="identity__name" style={{ '--badge': badgeNameColor(badge) || 'var(--text-h)' }}>
          Guest {participantId}
        </span>
        {badge ? <BadgeChip badge={badge} /> : <span className="identity__none">no badge</span>}
      </div>

      <input
        className="field"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search clubs & countries"
        aria-label="Search clubs and countries"
      />

      <div className="identity__list">
        {badge && !needle && (
          <button type="button" className="identity__clear" onClick={() => onChange(null)}>
            ✕ remove my badge
          </button>
        )}
        {groups.map(({ group, items }) => (
          <section key={group}>
            <h4>{group}</h4>
            <div className="identity__options">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="identity__option"
                  aria-pressed={badge?.id === item.id}
                  onClick={() => onChange(badgeSnapshot(item))}
                >
                  <BadgeChip badge={item} />
                </button>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="identity__empty">no club or country called “{search.trim()}” yet</p>}
      </div>

      {requesting ? (
        <BadgeRequestForm initialName={search.trim()} onDone={() => setRequesting(false)} />
      ) : (
        <button type="button" className="identity__request" onClick={() => setRequesting(true)}>
          can’t find yours? <b>ask us to add it</b>
        </button>
      )}
    </div>
  )
}

function BadgeRequestForm({ initialName, onDone }) {
  const showToast = useToast()
  const [name, setName] = useState(initialName)
  const [kind, setKind] = useState('club')
  const [where, setWhere] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) return
    setSending(true)
    try {
      await requestBadge({ name, kind, where, details })
      showToast('Request sent — we’ll add it soon ⚽', 'success')
      onDone()
    } catch (err) {
      showToast(err.message || 'Could not send the request', 'error')
      setSending(false)
    }
  }

  return (
    <form className="identity__form pop-in" onSubmit={submit}>
      <p className="section-label">
        request a badge <small>the admin adds it to the list</small>
      </p>
      <div className="identity__kinds" role="radiogroup" aria-label="Club or country">
        {[
          ['club', '🏟️ Club'],
          ['country', '🌍 Country'],
        ].map(([value, label]) => (
          <button key={value} type="button" className="chip" role="radio" aria-checked={kind === value} aria-selected={kind === value} onClick={() => setKind(value)}>
            {label}
          </button>
        ))}
      </div>
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'club' ? 'club name' : 'country'} maxLength={60} required aria-label="Name" />
      {kind === 'club' && (
        <input className="field" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="league / country (e.g. NPFL)" maxLength={60} aria-label="League or country" />
      )}
      <textarea className="field" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="anything else? (colours, nickname…)" maxLength={300} rows={2} aria-label="Details" />
      <div className="identity__form-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={sending}>
          Send request
        </Button>
      </div>
    </form>
  )
}

export function IdentitySheet({ participantId, badge, onChange, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <h2>your fan identity</h2>
      <p className="identity__intro">pick your side — your name takes its colour. nobody can see who you really are.</p>
      <IdentityPicker participantId={participantId} badge={badge} onChange={onChange} />
    </Sheet>
  )
}
