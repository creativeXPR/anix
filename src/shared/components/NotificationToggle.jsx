import { useState } from 'react'
import { useAuthUser } from '../auth-store.js'
import { disablePush, enablePush, pushEnabled } from '../notifications.js'
import { useToast } from '../toast-store.js'
import Spinner from './Spinner.jsx'
import './ThemeToggle.css'

export default function NotificationToggle() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [enabled, setEnabled] = useState(pushEnabled)
  const [pending, setPending] = useState(false)

  async function handleChange(event) {
    const next = event.target.checked
    setPending(true)
    try {
      if (next) {
        const ok = await enablePush(user.uid)
        if (!ok) {
          showToast('Notifications blocked or unavailable in this browser', 'error')
          setPending(false)
          return
        }
        setEnabled(true)
      } else {
        await disablePush(user.uid)
        setEnabled(false)
      }
    } catch {
      showToast('Could not update notifications', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <label className="theme-toggle">
      <span className="text-b3">Notifications</span>
      {pending ? (
        <Spinner size={16} />
      ) : (
        <input
          type="checkbox"
          className="theme-toggle__switch"
          checked={enabled}
          onChange={handleChange}
          aria-label="Toggle push notifications"
        />
      )}
    </label>
  )
}
