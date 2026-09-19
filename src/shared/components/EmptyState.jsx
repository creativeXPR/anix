import './EmptyState.css'

export default function EmptyState({ icon: Icon, title, size = 56 }) {
  return (
    <div className="empty-state">
      <Icon className="empty-state__icon" style={{ width: size, height: size }} />
      <p className="text-b3">{title}</p>
    </div>
  )
}
