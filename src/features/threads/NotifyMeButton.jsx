import { useState } from 'react'
import Button from '../../shared/components/Button.jsx'
import { getPushToken } from '../../shared/notifications.js'
import { useToast } from '../../shared/toast-store.js'
import { saveSenderPushToken } from './threads.js'

// Sender-only: opt in to a push when the owner replies (no account).
export default function NotifyMeButton({ threadId, compact }) {
  const showToast = useToast()
  const storageKey = `anix:thread-push:${threadId}`
  const [on, setOn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(storageKey))
    } catch {
      return false
    }
  })
  const [busy, setBusy] = useState(false)

  if (on) return compact ? null : <p className="thread__note">🔔 we'll notify you when they reply</p>

  async function handleClick() {
    setBusy(true)
    try {
      const token = await getPushToken()
      if (!token) {
        showToast('Notifications are blocked or unavailable in this browser', 'error')
        return
      }
      await saveSenderPushToken(threadId, token)
      try {
        localStorage.setItem(storageKey, '1')
      } catch {
        // fine — the button just reappears next visit
      }
      setOn(true)
      showToast("We'll notify you when they reply 🔔", 'success')
    } catch {
      showToast('Could not turn on notifications', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={compact ? 'secondary' : 'grad'} size={compact ? 'sm' : undefined} onClick={handleClick} loading={busy} className="thread__notify">
      🔔 Notify me when they reply
    </Button>
  )
}
