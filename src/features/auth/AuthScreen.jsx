import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../shared/components/Button.jsx'
import { getFirebaseAuth, googleProvider } from '../../shared/firebase.js'
import { useToast } from '../../shared/toast-store.js'
import './AuthScreen.css'

// Mirrors Anime-space's auth logic (src/App.jsx AuthScreen, src/auth.js):
// sign-up is the default landing mode, and Google is offered only from
// sign-in (signInWithPopup already creates the account if it doesn't
// exist, so a separate "sign up with Google" affordance is redundant —
// the email/password modes are the ones that genuinely differ).
export default function AuthScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'
  const showToast = useToast()
  const [mode, setMode] = useState('sign-up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Which action is in flight, if any — tracked separately (not one
  // shared `submitting` bool) so the spinner lands on the button the
  // user actually clicked, not both.
  const [pendingAction, setPendingAction] = useState(null) // 'email' | 'google' | null

  async function handleSubmit(event) {
    event.preventDefault()
    setPendingAction('email')
    try {
      const auth = getFirebaseAuth()
      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      navigate(redirectTo)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleGoogleSignIn() {
    setPendingAction('google')
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider)
      navigate(redirectTo)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPendingAction(null)
    }
  }

  const signIn = mode === 'sign-in'

  // NGL-style: gradient hero (glossy ghost, sticker wordmark, headline,
  // floating emoji) over a form card — side by side at desktop width.
  return (
    <section className="auth-screen">
      <div className="auth-screen__hero">
        <span className="auth-screen__floaty" style={{ top: '12%', left: '8%' }} aria-hidden="true">
          👋
        </span>
        <span className="auth-screen__floaty" style={{ top: '16%', right: '9%', animationDelay: '.6s' }} aria-hidden="true">
          💌
        </span>
        <span className="auth-screen__floaty" style={{ top: '38%', left: '6%', animationDelay: '1.1s' }} aria-hidden="true">
          👀
        </span>
        <span className="auth-screen__floaty" style={{ top: '42%', right: '7%', animationDelay: '.3s' }} aria-hidden="true">
          🔥
        </span>
        <img src="/icon.svg" alt="" className="auth-screen__ghost" />
        <span className="sticker-logo auth-screen__sticker">anix</span>
        <h1 className="auth-screen__headline">
          say it.
          <br />
          anonymously.
        </h1>
      </div>

      <div className="auth-screen__card">
        <form className="auth-screen__form" onSubmit={handleSubmit}>
          <h2>{signIn ? 'welcome back' : 'join the fun'}</h2>
          <input
            className="field"
            type="email"
            placeholder="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="password"
            autoComplete={signIn ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" block loading={pendingAction === 'email'} disabled={pendingAction === 'google'}>
            {signIn ? 'Sign in' : 'Sign up'}
          </Button>
        </form>

        {signIn && (
          <Button
            variant="secondary"
            block
            onClick={handleGoogleSignIn}
            loading={pendingAction === 'google'}
            disabled={pendingAction === 'email'}
          >
            Continue with Google
          </Button>
        )}

        <button
          type="button"
          className="auth-screen__switch"
          onClick={() => setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))}
        >
          {signIn ? (
            <>
              new here? <b>sign up</b>
            </>
          ) : (
            <>
              already have an account? <b>sign in</b>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
