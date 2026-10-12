import { signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import Button from '../../shared/components/Button.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import NotificationToggle from '../../shared/components/NotificationToggle.jsx'
import Page from '../../shared/components/Page.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import SoundToggle from '../../shared/components/SoundToggle.jsx'
import ThemeToggle from '../../shared/components/ThemeToggle.jsx'
import { getFirebaseAuth } from '../../shared/firebase.js'
import { useInstall } from '../../shared/install-store.js'
import { useToast } from '../../shared/toast-store.js'
import { subscribeToOwnedRooms } from '../chatroom/messages.js'
import { subscribeToInbox, subscribeToOwnedEndpoints } from '../inbox/inbox.js'
import { submitFeedback } from './feedback.js'
import './ProfileScreen.css'

// subscribeToInbox pages at 50 — past that the count reads "50+".
const INBOX_PAGE = 50

export default function ProfileScreen() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const { canInstall, promptInstall } = useInstall()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const stats = useProfileStats(user.uid)

  async function handleLogout() {
    setConfirmingSignOut(false)
    setLoggingOut(true)
    try {
      await signOut(getFirebaseAuth())
    } catch (err) {
      setLoggingOut(false)
      showToast(err.message, 'error')
    }
  }

  return (
    <Page title="profile">
      <div className="profile-hero pop-in">
        <img className="profile-hero__avatar" src="/icon.svg" alt="" />
        <div className="profile-hero__copy">
          <h2>hey you 👋</h2>
          <small>{user.email}</small>
        </div>
      </div>

      <div className="profile-stats">
        <Stat value={stats.messages} label="messages" />
        <Stat value={stats.links} label="links" />
        <Stat value={stats.rooms} label="rooms" />
      </div>

      <div className="settings-card">
        <ThemeToggle />
        <NotificationToggle />
        <SoundToggle />
        {canInstall && (
          <div className="settings-row">
            <span className="settings-row__emoji" aria-hidden="true">
              📲
            </span>
            <b>install anix</b>
            <Button size="sm" onClick={promptInstall}>
              Install
            </Button>
          </div>
        )}
        <div className="settings-row">
          <span className="settings-row__emoji" aria-hidden="true">
            💬
          </span>
          <b>send feedback</b>
          <Button size="sm" variant="secondary" onClick={() => setFeedbackOpen(true)}>
            Open
          </Button>
        </div>
      </div>

      <Button variant="secondary" block onClick={() => setConfirmingSignOut(true)} loading={loggingOut}>
        Sign out
      </Button>

      <p className="profile-footer">powered by IARdays x creativeXPR</p>

      {feedbackOpen && <FeedbackSheet userId={user.uid} onClose={() => setFeedbackOpen(false)} />}
      {confirmingSignOut && (
        <ConfirmDialog
          title="sign out?"
          message="You can sign back in anytime."
          confirmLabel="Sign out"
          onConfirm={handleLogout}
          onCancel={() => setConfirmingSignOut(false)}
        />
      )}
    </Page>
  )
}

function Stat({ value, label }) {
  return (
    <div className="profile-stat">
      <b>{value ?? '–'}</b>
      <small>{label}</small>
    </div>
  )
}

// Counts for the stats row: links, rooms, and messages across all links.
function useProfileStats(uid) {
  const [endpoints, setEndpoints] = useState(null)
  const [rooms, setRooms] = useState(null)
  const [inboxCounts, setInboxCounts] = useState({})

  useEffect(() => subscribeToOwnedEndpoints(uid, setEndpoints), [uid])
  useEffect(() => subscribeToOwnedRooms(uid, setRooms), [uid])
  useEffect(() => {
    const unsubscribes = (endpoints || []).map((endpoint) =>
      subscribeToInbox(endpoint.id, (messages) =>
        setInboxCounts((current) => ({ ...current, [endpoint.id]: messages.length })),
      ),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [endpoints])

  const counts = (endpoints || []).map((endpoint) => inboxCounts[endpoint.id])
  const messagesLoaded = endpoints !== null && counts.every((count) => count !== undefined)
  const total = counts.reduce((sum, count) => sum + (count || 0), 0)
  return {
    links: endpoints?.length,
    rooms: rooms?.length,
    messages: messagesLoaded ? (counts.some((count) => count >= INBOX_PAGE) ? `${total}+` : total) : undefined,
  }
}

const KINDS = [
  { value: 'bug', emoji: '🐞', label: 'bug', placeholder: 'what broke? what were you doing when it happened?' },
  { value: 'idea', emoji: '💡', label: 'idea', placeholder: 'what should anix do next?' },
  { value: 'love', emoji: '💜', label: 'love', placeholder: 'tell us what you love 🥹' },
]

function FeedbackSheet({ userId, onClose }) {
  const showToast = useToast()
  const [kind, setKind] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const selected = KINDS.find((option) => option.value === kind)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await submitFeedback(userId, text, kind)
      setSent(true)
    } catch {
      showToast('Could not send feedback', 'error')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Sheet onClose={onClose}>
        <div className="feedback-thanks">
          <span className="feedback-thanks__emoji" aria-hidden="true">
            {kind === 'bug' ? '🛠️' : kind === 'idea' ? '✨' : '💜'}
          </span>
          <h2>thank you!</h2>
          <p>{kind === 'bug' ? "we're on it." : 'we read every single one.'}</p>
          <Button variant="secondary" block onClick={onClose}>
            Done
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet as="form" onClose={onClose} onSubmit={handleSubmit}>
      <h2>talk to us 💬</h2>
      <div className="feedback-kinds" role="radiogroup" aria-label="Feedback type">
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={kind === option.value}
            className="feedback-kind"
            onClick={() => setKind((current) => (current === option.value ? null : option.value))}
          >
            <span aria-hidden="true">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>
      <textarea
        className="field"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={selected?.placeholder || "what's on your mind? the more detail the better…"}
        aria-label="Feedback"
        maxLength={1000}
        rows={4}
      />
      <Button type="submit" block disabled={!text.trim()} loading={sending}>
        {sending ? 'Sending…' : 'Send feedback'}
      </Button>
      <p className="feedback-note">🔒 only the anix team reads this — it's tied to your account so we can follow up</p>
    </Sheet>
  )
}
