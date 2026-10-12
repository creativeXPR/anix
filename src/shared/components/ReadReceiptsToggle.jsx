import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { setReadReceipts } from '../../features/threads/threads.js'
import { useAuthUser } from '../auth-store.js'
import { db } from '../firebase.js'
import { useToast } from '../toast-store.js'

// A settings row (Profile): ✓✓ "seen" in your private chats. Off by
// default — anonymity first. It works both ways, like WhatsApp: when off,
// senders don't see that you read their messages and you don't see when
// they read your replies.
export default function ReadReceiptsToggle() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [enabled, setEnabled] = useState(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => setEnabled(snap.data()?.readReceipts === true))
      .catch(() => setEnabled(false))
  }, [user])

  if (!user) return null

  return (
    <div className="settings-row">
      <span className="settings-row__emoji" aria-hidden="true">
        👀
      </span>
      <b>read receipts</b>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={enabled === true}
        aria-label="Read receipts in private chats"
        disabled={enabled === null}
        onClick={async () => {
          const next = !enabled
          setEnabled(next)
          try {
            await setReadReceipts(user.uid, next)
          } catch (err) {
            console.error('read receipts toggle failed', err)
            setEnabled(!next)
            showToast('Could not change read receipts — try again.', 'error')
          }
        }}
      />
    </div>
  )
}
