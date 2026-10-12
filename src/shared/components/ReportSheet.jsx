import { useState } from 'react'
import Button from './Button.jsx'
import Sheet from './Sheet.jsx'

// "Why are you reporting this?" — a reason list, then Send. Reports go to
// the /admin dashboard. `onReport(reason)` does the write.
export default function ReportSheet({ title = 'report this', reasons, onReport, onClose }) {
  const [reason, setReason] = useState(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend() {
    setSending(true)
    setError(null)
    try {
      await onReport(reason)
      setDone(true)
    } catch {
      setError('Could not send the report — try again.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <Sheet onClose={onClose}>
        <div className="report-done">
          <span aria-hidden="true">🛡️</span>
          <h2>thanks for telling us</h2>
          <p>We review every report. If you&apos;re in danger, contact local emergency services.</p>
          <Button variant="secondary" block onClick={onClose}>
            Done
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{title}</h2>
      <p className="report-sub">What&apos;s wrong with it? Only the Anix team sees reports.</p>
      <div className="report-reasons" role="radiogroup" aria-label="Reason">
        {reasons.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={reason === r.value}
            className="report-reason"
            onClick={() => setReason(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>
      {error && <p className="error-text text-b3">{error}</p>}
      <Button variant="danger" block disabled={!reason} loading={sending} onClick={handleSend}>
        Send report
      </Button>
    </Sheet>
  )
}
