import { useState } from 'react'
import { useAuthUser } from '../auth-store.js'
import { disablePush, enablePush, pushEnabled } from '../notifications.js'
import { useToast } from '../toast-store.js'
import Spinner from './Spinner.jsx'

export default function NotificationToggle() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [enabled, setEnabled] = useState(pushEnabled)
  const [pending, setPending] = useState(false)

  async function handleChange() {
    const next = !enabled
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

  // A settings row (Profile), same shape as ThemeToggle.
  return (
    <div className="settings-row">
      <span className="settings-row__emoji" aria-hidden="true">
        🔔
      </span>
      <b>push notifications</b>
      {pending ? (
        <Spinner size={18} />
      ) : (
        <button
          type="button"
          className="toggle"
          role="switch"
          aria-checked={enabled}
          aria-label="Push notifications"
          onClick={handleChange}
        />
      )}
    </div>
  )
}
