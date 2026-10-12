import { useCallback, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, getFirebaseAuth } from '../../shared/firebase.js'
import Spinner from '../../shared/components/Spinner.jsx'
import { ContactList, FeedbackList } from './InboxLists.jsx'
import ModerationQueue from './ModerationQueue.jsx'
import ReportsList from './ReportsList.jsx'
import VisitorsChart from './VisitorsChart.jsx'
import './AdminApp.css'

// Anyone can land here — the passcode gate doesn't require a real Anix
// account, so a visitor with no session yet is signed in anonymously
// purely to get a request.auth.uid the rules can scope the
// adminUnlocks doc to. A user already signed into a real account keeps
// using that uid instead (checked first). Mirrors Anime-space's
// AdminApp.jsx exactly — see firestore.rules for the server-side half
// of this (admin/gate, adminUnlocks/{uid}).
function useAdminUid() {
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (user) {
        setUid(user.uid)
        return
      }
      try {
        const credential = await signInAnonymously(getFirebaseAuth())
        setUid(credential.user.uid)
      } catch (err) {
        console.error('anonymous sign-in failed', err)
      }
    })
    return unsub
  }, [])

  return uid
}

function AdminGate({ uid, onUnlocked }) {
  const [checking, setChecking] = useState(true)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'adminUnlocks', uid))
        if (!cancelled && snap.exists()) onUnlocked()
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uid, onUnlocked])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await setDoc(doc(db, 'adminUnlocks', uid), { passcode, unlockedAt: serverTimestamp() })
      onUnlocked()
    } catch (err) {
      console.error('admin unlock failed', err)
      setError('Incorrect passcode.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <form className="admin-gate-card" onSubmit={handleSubmit}>
        <h1>Admin access</h1>
        <p>Enter the passcode to view reports and feedback.</p>
        <input
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          placeholder="Passcode"
          autoFocus
          required
        />
        {error && <div className="admin-error">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Proceed'}
        </button>
      </form>
    </div>
  )
}

// Tabbed dashboard (2026-10-12). Every panel stays mounted (just hidden)
// so its live listener keeps the tab's count badge current; the tab lives
// in the URL hash (/admin#reports) so a refresh keeps your place.
const TABS = [
  { key: 'overview', label: 'Overview', icon: '📈' },
  { key: 'moderation', label: 'Moderation', icon: '🛡️', urgent: true },
  { key: 'reports', label: 'Reports', icon: '🚩', urgent: true },
  { key: 'feedback', label: 'Feedback', icon: '💬' },
  { key: 'contact', label: 'Contact', icon: '✉️' },
]

function initialTab() {
  const hash = window.location.hash.slice(1)
  return TABS.some((t) => t.key === hash) ? hash : 'overview'
}

function AdminDashboard() {
  const [tab, setTab] = useState(initialTab)
  const [counts, setCounts] = useState({})
  const setCount = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.key, (n) => setCounts((c) => (c[t.key] === n ? c : { ...c, [t.key]: n }))]),
      ),
    [],
  )

  function open(key) {
    setTab(key)
    window.history.replaceState(null, '', `#${key}`)
    window.scrollTo({ top: 0 })
  }

  const current = TABS.find((t) => t.key === tab)

  return (
    <div className="admin-shell admin-dashboard">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/icon.svg" alt="" />
          <div>
            <b>anix admin</b>
            <small>{current.label}</small>
          </div>
        </div>
        <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => open(t.key)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`admin-badge${t.urgent ? ' admin-badge--urgent' : ''}`}>{counts[t.key]}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div role="tabpanel" hidden={tab !== 'overview'} className="admin-panel">
        <div className="admin-tiles">
          {TABS.slice(1).map((t) => (
            <button key={t.key} type="button" className={`admin-tile${t.urgent && counts[t.key] > 0 ? ' admin-tile--urgent' : ''}`} onClick={() => open(t.key)}>
              <span aria-hidden="true">{t.icon}</span>
              <b>{counts[t.key] ?? '…'}</b>
              <small>{t.urgent ? `${t.label.toLowerCase()} to review` : t.label.toLowerCase()}</small>
            </button>
          ))}
        </div>
        <VisitorsChart />
      </div>
      <div role="tabpanel" hidden={tab !== 'moderation'} className="admin-panel">
        <ModerationQueue onCount={setCount.moderation} />
      </div>
      <div role="tabpanel" hidden={tab !== 'reports'} className="admin-panel">
        <ReportsList onCount={setCount.reports} />
      </div>
      <div role="tabpanel" hidden={tab !== 'feedback'} className="admin-panel">
        <FeedbackList onCount={setCount.feedback} />
      </div>
      <div role="tabpanel" hidden={tab !== 'contact'} className="admin-panel">
        <ContactList onCount={setCount.contact} />
      </div>
    </div>
  )
}

export default function AdminApp() {
  const uid = useAdminUid()
  const [unlocked, setUnlocked] = useState(false)
  const handleUnlocked = useCallback(() => setUnlocked(true), [])

  if (!uid) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      </div>
    )
  }

  return unlocked ? <AdminDashboard /> : <AdminGate uid={uid} onUnlocked={handleUnlocked} />
}
