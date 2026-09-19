import './Page.css'

// Top-anchored header + scrollable content — matches Anime-space's
// .chat-header/.group-list stacked structure. Distinct from the
// vertically-centered `.screen` class, which stays for simple forms
// (Auth, the anonymous-message composer).
export default function Page({ title, brand, children }) {
  return (
    <div className="page">
      <header className={`page__header${brand ? ' page__header--fixed' : ''}`}>
        {brand && <img className="page__logo" src="/icon.jpg" alt="" width={32} height={32} />}
        <h1 className="page__title">{title}</h1>
      </header>
      <div className={`page__content${brand ? ' page__content--fixed-header' : ''}`}>{children}</div>
    </div>
  )
}
