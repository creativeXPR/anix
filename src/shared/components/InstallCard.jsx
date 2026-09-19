import { useState } from 'react'
import { useInstall } from '../install-context.jsx'
import Button from './Button.jsx'
import './InstallCard.css'

// Two looks, one component: `floating` (the popup that appears over the
// app, dismissible for the current page load only — no localStorage, so
// a refresh always re-evaluates it against a fresh `beforeinstallprompt`
// event rather than staying suppressed for a week) and the default
// static card (used on Profile as a permanent, always-available install
// entry point, so dismissing the popup doesn't remove every way to
// install).
export default function InstallCard({ floating = false, dismissible = false }) {
  const { canInstall, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || (dismissible && dismissed)) return null

  return (
    <div className={`install-card${floating ? ' install-card--floating' : ''}`}>
      <img src="/icon.jpg" alt="" className="install-card__icon" />
      <div className="install-card__copy">
        <strong>Anix</strong>
        <span className="text-b4">Anonymous chat &amp; messages</span>
      </div>
      <div className="install-card__actions">
        {dismissible && (
          <button type="button" className="install-card__dismiss" onClick={() => setDismissed(true)}>
            Not now
          </button>
        )}
        <Button onClick={promptInstall}>Install</Button>
      </div>
    </div>
  )
}
