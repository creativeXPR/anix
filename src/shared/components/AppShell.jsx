import { useViewportTier } from '../hooks/use-viewport-tier.js'
import NavBar from './NavBar.jsx'
import './AppShell.css'

export default function AppShell({ children }) {
  const tier = useViewportTier()
  const orientation = tier === 'desktop' ? 'rail' : 'bottom'

  return (
    <div className={`app-shell app-shell--${orientation}`}>
      {orientation === 'rail' && <NavBar orientation="rail" />}
      <main className="app-shell__content">{children}</main>
      {orientation === 'bottom' && <NavBar orientation="bottom" />}
    </div>
  )
}
