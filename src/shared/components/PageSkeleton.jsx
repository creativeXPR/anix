import CardSkeleton from './CardSkeleton.jsx'
import './PageSkeleton.css'

// Shown while the signed-in check (Firebase auth) is still resolving on a
// fresh load — before this, RequireAuth rendered nothing, so the page sat
// blank with only the nav pill showing. Same shapes as a real page: a
// title bar, a big heading line, then cards.
export default function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <div className="page-skeleton__bar page-skeleton__bar--brand" />
      <div className="page-skeleton__bar page-skeleton__bar--title" />
      <div className="page-skeleton__bar page-skeleton__bar--sub" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
