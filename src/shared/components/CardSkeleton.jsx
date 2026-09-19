import './CardSkeleton.css'

// Mirrors Card's badge+title/subtitle shape, so a loading list reads as
// "cards are about to appear here" rather than the page looking broken
// or just blank while rooms/endpoints/messages are still being fetched.
export default function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <div className="card-skeleton__badge" />
      <div className="card-skeleton__lines">
        <div className="card-skeleton__line card-skeleton__line--title" />
        <div className="card-skeleton__line card-skeleton__line--subtitle" />
      </div>
    </div>
  )
}
