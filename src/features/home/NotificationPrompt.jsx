import { useState } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import Button from '../../shared/components/Button.jsx'
import { enablePush, pushConfigured, pushEnabled } from '../../shared/notifications.js'
import { useToast } from '../../shared/toast-store.js'
import '../../shared/components/modal.css'

// Only shown when permission is still undecided — 'granted'/'denied'
// are final (a browser won't re-prompt on 'denied', asking again would
// silently no-op), and pushEnabled() already covers 'granted' via the
// stored token. "Not now" is local component state only, no
// localStorage — reappears next visit rather than being suppressed
// for a week, same fix as the install prompt's own dismiss bug.
export default function NotificationPrompt() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [dismissed, setDismissed] = useState(false)
  const [enabling, setEnabling] = useState(false)

  const eligible =
    pushConfigured() && !pushEnabled() && typeof Notification !== 'undefined' && Notification.permission === 'default'
  if (!eligible || dismissed) return null

  async function handleEnable() {
    setEnabling(true)
    try {
      const ok = await enablePush(user.uid)
      showToast(ok ? 'Notifications enabled' : 'Could not enable notifications', ok ? 'success' : 'error')
    } finally {
      setEnabling(false)
      setDismissed(true)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setDismissed(true)}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>Never miss a message</h2>
        <p className="text-b3">
          Turn on notifications to know the moment someone sends you an anonymous message, joins your room, or
          something gets reported.
        </p>
        <div className="modal__actions">
          <Button type="button" variant="secondary" onClick={() => setDismissed(true)} disabled={enabling}>
            Not now
          </Button>
          <Button type="button" onClick={handleEnable} loading={enabling}>
            Enable
          </Button>
        </div>
      </div>
    </div>
  )
}
