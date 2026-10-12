import { Link, NavLink } from 'react-router-dom'
import { usePageTitle } from './use-page-title.js'
import './welcome.css'

// Public site at /welcome (NGL-style, Design Playbook 003-30; approved
// prototype: test/anix-welcome.html). No social media links, by design.
// Blog joins the nav only once there are posts.
const NAV = [
  { to: '/welcome/about', label: 'About' },
  { to: '/welcome/safety', label: 'Safety' },
  { to: '/welcome/contact', label: 'Contact us' },
]

export function WelcomeHeader() {
  return (
    <header className="wl-header">
      <Link className="wl-brand" to="/welcome" aria-label="Anix home">
        <img src="/icon.svg" alt="" />
        <span className="wl-sticker">anix</span>
      </Link>
      <nav className="wl-nav" aria-label="Site">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'is-on' : undefined)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {/* Signed in → Home; signed out → RequireAuth sends you to /auth. */}
      <Link className="wl-pill wl-pill--ink" to="/">
        Open app
      </Link>
    </header>
  )
}

export function WelcomeFooter() {
  return (
    <footer className="wl-foot">
      <div className="wl-foot__top">
        <Link className="wl-brand" to="/welcome" aria-label="Anix home">
          <img src="/icon.svg" alt="" />
          <span className="wl-sticker">anix</span>
        </Link>
        <nav className="wl-foot__nav" aria-label="Footer">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="wl-foot__bottom">
        <div className="wl-foot__legal">
          <Link to="/welcome/terms">Terms of Service</Link>
          <Link to="/welcome/privacy">Privacy Policy</Link>
          <Link to="/welcome/guidelines">Community Guidelines</Link>
        </div>
        <div>made with 💜 by IARdays x creativeXPR</div>
      </div>
    </footer>
  )
}

// About / Safety / Contact / Terms / Privacy: gradient header strip, a
// readable column that follows the app's light/dark theme, the footer.
export function InnerPage({ title, kicker, heading, lead, children }) {
  usePageTitle(`${title} — Anix`)
  return (
    <div className="wl wl-inner">
      <div className="wl-site wl-site--bar">
        <WelcomeHeader />
      </div>
      <main className="wl-page">
        <span className="wl-kicker">{kicker}</span>
        <h1>{heading}</h1>
        {lead && <p className="wl-lead">{lead}</p>}
        {children}
      </main>
      <WelcomeFooter />
    </div>
  )
}
