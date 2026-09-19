import './Card.css'

// Flat, no-shadow card — matches Anime-space's .group-card language
// (badge + title/subtitle "copy" block + optional small pill actions),
// recolored onto Anix's own tokens.
export default function Card({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {Icon && (
        <div className="card__badge">
          <Icon className="card__badge-icon" />
        </div>
      )}
      <div className="card__copy">
        <strong className="card__title">{title}</strong>
        {subtitle && <small className="card__subtitle text-b3">{subtitle}</small>}
        {children}
      </div>
    </div>
  )
}
