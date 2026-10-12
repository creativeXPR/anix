import './SendStatus.css'

// WhatsApp-style delivery mark in the corner of your own bubble:
//   sending → a ring that fills (real `progress` 0–1 for image uploads;
//             without it, it eases toward ~90% while waiting — a send is
//             one request with no measurable progress)
//   sent    → ✓
//   seen    → ✓✓ in the accent color (private chats only)
const R = 6
const C = 2 * Math.PI * R

export default function SendStatus({ state, progress = null }) {
  if (state === 'sending') {
    const known = typeof progress === 'number'
    return (
      <span className={`send-status send-status--sending${known ? '' : ' is-indeterminate'}`} role="img" aria-label={known ? `Sending, ${Math.round(progress * 100)}%` : 'Sending'}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle className="send-status__track" cx="8" cy="8" r={R} />
          <circle
            className="send-status__fill"
            cx="8"
            cy="8"
            r={R}
            strokeDasharray={C}
            style={known ? { strokeDashoffset: C * (1 - Math.max(0.04, Math.min(1, progress))) } : undefined}
          />
        </svg>
      </span>
    )
  }
  return (
    <span className={`send-status send-status--${state}`} role="img" aria-label={state === 'seen' ? 'Seen' : 'Sent'}>
      <svg viewBox="0 0 18 12" aria-hidden="true">
        <path d="M1.5 6.5 4.6 9.6 10.5 2.5" />
        {state === 'seen' && <path d="M7.5 9.4 7.7 9.6 13.6 2.5" />}
      </svg>
    </span>
  )
}
