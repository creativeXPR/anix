import Button from './Button.jsx'
import Sheet from './Sheet.jsx'

// The "are you sure?" step every delete/remove goes through (standing
// rule). A sheet like the rest, so it can be dragged away to cancel.
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Sheet onClose={onCancel} role="alertdialog">
      <h2>{title}</h2>
      <p className="text-b3" style={{ margin: 0, color: 'var(--text-muted)' }}>
        {message}
      </p>
      <div className="sheet__actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}
