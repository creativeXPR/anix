import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, getFirebaseAuth } from '../../shared/firebase.js'
import Spinner from '../../shared/components/Spinner.jsx'
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

function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleString()
}

function AdminDashboard() {
  const [reports, setReports] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const q = query(collectionGroup(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReports(
          snap.docs.map((d) => ({
            id: d.id,
            roomId: d.ref.parent.parent?.id ?? '—',
            ...d.data(),
          })),
        )
      },
      (err) => {
        console.error('reports listen failed', err)
        setReports([])
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error('feedback listen failed', err)
        setFeedback([])
      },
    )
    return unsub
  }, [])

  return (
    <div className="admin-shell admin-dashboard">
      <section>
        <header className="admin-header">
          <h1>Reports</h1>
          <div className="admin-count">{reports === null ? '…' : `${reports.length} total`}</div>
        </header>
        {reports === null ? (
          <div className="admin-loading">
            <Spinner size={32} />
          </div>
        ) : reports.length === 0 ? (
          <div className="admin-empty">No reports yet.</div>
        ) : (
          <div className="admin-list">
            {reports.map((item) => (
              <div key={item.id} className="admin-card">
                <div className="admin-card__meta">
                  <span>Room {item.roomId}</span>
                  <span>{formatTimestamp(item.createdAt)}</span>
                </div>
                <p className="admin-card__text">Message {item.messageId} · reported by guest {item.reporterId}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <header className="admin-header">
          <h1>Feedback</h1>
          <div className="admin-count">{feedback === null ? '…' : `${feedback.length} total`}</div>
        </header>
        {feedback === null ? (
          <div className="admin-loading">
            <Spinner size={32} />
          </div>
        ) : feedback.length === 0 ? (
          <div className="admin-empty">No feedback yet.</div>
        ) : (
          <div className="admin-list">
            {feedback.map((item) => (
              <div key={item.id} className="admin-card">
                <div className="admin-card__meta">
                  <span>User {item.userId}</span>
                  <span>{formatTimestamp(item.createdAt)}</span>
                </div>
                <p className="admin-card__text">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
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
