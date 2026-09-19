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

  return (
    <section className="screen auth-screen">
      <div className="auth-screen__brand">
        <img src="/icon.jpg" alt="" className="auth-screen__brand-logo" />
        <span>Anix</span>
      </div>

      <h1>{mode === 'sign-in' ? 'Sign in' : 'Sign up'}</h1>

      <form className="auth-screen__form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
        <Button
          type="submit"
          loading={pendingAction === 'email'}
          disabled={pendingAction === 'google'}
        >
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </Button>
      </form>

      {mode === 'sign-in' && (
        <Button
          variant="secondary"
          onClick={handleGoogleSignIn}
          loading={pendingAction === 'google'}
          disabled={pendingAction === 'email'}
        >
          Continue with Google
        </Button>
      )}

      <button
        type="button"
        className="auth-screen__switch text-b3"
        onClick={() => setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </section>
  )
}
