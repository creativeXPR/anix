import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import Button from '../../shared/components/Button.jsx'
import Card from '../../shared/components/Card.jsx'
import InstallCard from '../../shared/components/InstallCard.jsx'
import Page from '../../shared/components/Page.jsx'
import ThemeToggle from '../../shared/components/ThemeToggle.jsx'
import { getFirebaseAuth } from '../../shared/firebase.js'
import LogoutIcon from '../../shared/icons/LogoutIcon.jsx'
import Spinner from '../../shared/components/Spinner.jsx'
import { useToast } from '../../shared/toast-store.js'
import { getProfilePrompt } from '../../shared/utils/greetings.js'
import { submitFeedback } from './feedback.js'
import './ProfileScreen.css'

export default function ProfileScreen() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [prompt] = useState(getProfilePrompt)

  const [feedbackText, setFeedbackText] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut(getFirebaseAuth())
    } catch (err) {
      setLoggingOut(false)
      showToast(err.message, 'error')
    }
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault()
    setSubmittingFeedback(true)
    try {
      await submitFeedback(user.uid, feedbackText)
      setFeedbackText('')
      showToast('Feedback sent — thank you', 'success')
    } catch {
      showToast('Could not send feedback', 'error')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <Page title="Profile">
      <p className="page-greeting">
        {prompt.text} {prompt.emoji}
      </p>

      <InstallCard />

      <Card title={user.email} subtitle="Signed in">
        <div className="card__actions">
          <button
            type="button"
            className="card__pill-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <Spinner size={14} /> : <LogoutIcon />}
            Log out
          </button>
        </div>
      </Card>

      <div className="profile-screen__section">
        <span className="text-b3">Appearance</span>
        <ThemeToggle />
      </div>

      <form className="profile-screen__section" onSubmit={handleFeedbackSubmit}>
        <label className="text-b3" htmlFor="feedback">
          Feedback for the developers
        </label>
        <textarea
          id="feedback"
          value={feedbackText}
          onChange={(event) => setFeedbackText(event.target.value)}
          placeholder="What should we fix or add?"
          rows={3}
          required
        />
        <Button type="submit" variant="secondary" loading={submittingFeedback}>
          Send feedback
        </Button>
      </form>

      <p className="profile-screen__footer text-b4">powered by IARdays x creativeXPR</p>
    </Page>
  )
}
