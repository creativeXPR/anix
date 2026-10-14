import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import Spinner from '../../shared/components/Spinner.jsx'
import { db } from '../../shared/firebase.js'
import BadgeChip from '../football/BadgeChip.jsx'
import { slugify } from '../football/badges.js'
import { KITS } from '../rooms/kits.js'
import { deleteBadge, saveBadge } from '../football/football-data.js'

// /admin → Badges: fan-badge requests from football rooms ("can't find my
// club/country") and the badges added here (Firestore `badges/{id}`) on
// top of the built-in list. Adding a badge needs no redeploy.
function formatTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : ''
}

const KIT_TYPES = Object.entries(KITS).filter(([, kit]) => kit.badges)
const BUILT_IN = KIT_TYPES.reduce((n, [, kit]) => n + kit.badges.length, 0)
const EMPTY = { type: 'football', name: '', group: 'NPFL', emoji: '', c1: '#7b1fd4', c2: '#ffffff' }

export default function BadgesAdmin({ onCount }) {
  const [requests, setRequests] = useState(null)
  const [added, setAdded] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [fromRequest, setFromRequest] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'request' | 'badge', id, label }
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'badgeRequests'), orderBy('createdAt', 'desc')),
        (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error('badge requests listen failed', err)
          setRequests([])
        },
      ),
    [],
  )
  useEffect(
    () => onSnapshot(collection(db, 'badges'), (snap) => setAdded(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setAdded([])),
    [],
  )
  useEffect(() => {
    if (requests) onCount?.(requests.length)
  }, [requests, onCount])

  function startFromRequest(request) {
    setFromRequest(request.id)
    const type = request.type || 'football'
    const groups = KITS[type]?.badgeGroups || []
    setForm({
      ...EMPTY,
      type,
      name: request.name,
      group: request.kind === 'country' ? 'Countries' : groups.includes(request.where) ? request.where : request.where || groups[groups.length - 1] || 'Elsewhere',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function add(event) {
    event.preventDefault()
    const id = slugify(form.name)
    if (!id) return
    setSaving(true)
    try {
      await saveBadge({
        id,
        type: form.type,
        name: form.name.trim(),
        group: form.group.trim() || 'Elsewhere',
        colors: [form.c1, form.c2],
        ...(form.emoji.trim() ? { emoji: form.emoji.trim() } : {}),
      })
      if (fromRequest) await deleteDoc(doc(db, 'badgeRequests', fromRequest))
      setNotice(`Added “${form.name.trim()}”.`)
      setForm(EMPTY)
      setFromRequest(null)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function run() {
    const { kind, id } = confirm
    setConfirm(null)
    try {
      if (kind === 'request') await deleteDoc(doc(db, 'badgeRequests', id))
      else await deleteBadge(id)
      setNotice(kind === 'request' ? 'Request dismissed.' : 'Badge removed.')
    } catch (err) {
      setNotice(err.message)
    }
  }

  const preview = form.name.trim() ? { id: 'preview', name: form.name.trim(), colors: [form.c1, form.c2], emoji: form.emoji.trim() || null } : null
  const groups = [...new Set([...(KITS[form.type]?.badgeGroups || []), ...added.filter((b) => (b.type || 'football') === form.type).map((b) => b.group).filter(Boolean)])]

  return (
    <section>
      {notice && <p className="admin-notice">{notice}</p>}

      <form className="admin-card admin-badge-form" onSubmit={add}>
        <b>{fromRequest ? 'add the requested badge' : 'add a badge'}</b>
        <div className="admin-badge-form__grid">
          <select className="admin-search" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, group: KITS[e.target.value].badgeGroups?.[0] || '' })} aria-label="Room type">
            {KIT_TYPES.map(([key, kit]) => (
              <option key={key} value={key}>
                {kit.label}
              </option>
            ))}
          </select>
          <input className="admin-search" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="name (e.g. Ikorodu City)" maxLength={40} required />
          <input className="admin-search" list="badge-groups" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="group (league, Countries…)" maxLength={40} />
          <datalist id="badge-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <input className="admin-search" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="emoji (flag / series / vibe)" maxLength={8} />
          <label className="admin-badge-form__colors">
            colours
            <input type="color" value={form.c1} onChange={(e) => setForm({ ...form, c1: e.target.value })} aria-label="Main colour" />
            <input type="color" value={form.c2} onChange={(e) => setForm({ ...form, c2: e.target.value })} aria-label="Second colour" />
            {preview && <BadgeChip badge={preview} size="md" />}
          </label>
        </div>
        <div className="admin-card__actions">
          {fromRequest && (
            <button
              type="button"
              onClick={() => {
                setFromRequest(null)
                setForm(EMPTY)
              }}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add badge'}
          </button>
        </div>
      </form>

      <h2 className="admin-subhead">requests</h2>
      {requests === null ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-empty">No badge requests.</div>
      ) : (
        <div className="admin-list">
          {requests.map((r) => (
            <div key={r.id} className="admin-card">
              <div className="admin-card__meta">
                <span>
                  {KITS[r.type || 'football']?.label} · {{ country: '🌍 country', club: '🏟️ club', series: '📺 anime', vibe: '✨ vibe' }[r.kind] || r.kind}
                  {r.where ? ` · ${r.where}` : ''}
                </span>
                <span>{formatTimestamp(r.createdAt)}</span>
              </div>
              <p className="admin-card__text">
                <b>{r.name}</b>
                {r.details ? ` — ${r.details}` : ''}
              </p>
              <div className="admin-card__actions">
                <button type="button" className="primary" onClick={() => startFromRequest(r)}>
                  Add as badge
                </button>
                <button type="button" onClick={() => setConfirm({ kind: 'request', id: r.id, label: r.name })}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="admin-subhead">
        added here <small>{added.length} · plus {BUILT_IN} built in</small>
      </h2>
      {added.length === 0 ? (
        <div className="admin-empty">Nothing added yet.</div>
      ) : (
        <div className="admin-badge-list">
          {added.map((b) => (
            <span key={b.id} className="admin-badge-list__item">
              <BadgeChip badge={b} size="md" />
              <small>
                {KITS[b.type || 'football']?.emoji} {b.group}
              </small>
              <button type="button" onClick={() => setConfirm({ kind: 'badge', id: b.id, label: b.name })} aria-label={`Remove ${b.name}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'request' ? 'dismiss this request?' : `remove “${confirm.label}”?`}
          message={
            confirm.kind === 'request'
              ? `The request for “${confirm.label}” is deleted. Nothing is added.`
              : 'It disappears from the badge list. Past messages keep showing it.'
          }
          confirmLabel={confirm.kind === 'request' ? 'Dismiss' : 'Remove'}
          onConfirm={run}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  )
}
