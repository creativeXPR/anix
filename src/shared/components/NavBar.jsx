import { NavLink } from 'react-router-dom'
import { useUnreadCounts } from '../../features/inbox/use-unread-counts.js'
import { useAuthUser } from '../auth-store.js'
import HomeIcon from '../icons/HomeIcon.jsx'
import MessageIcon from '../icons/MessageIcon.jsx'
import ProfileIcon from '../icons/ProfileIcon.jsx'
import './NavBar.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/chats', label: 'Chats', Icon: MessageIcon },
  { to: '/profile', label: 'Profile', Icon: ProfileIcon },
]

export default function NavBar({ orientation }) {
  const { user } = useAuthUser()
  const { total: unread } = useUnreadCounts(user?.uid)

  return (
    <nav className={`nav-bar nav-bar--${orientation}`}>
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `nav-bar__item${isActive ? ' nav-bar__item--active' : ''}`
          }
          aria-label={to === '/chats' && unread ? `${label}, ${unread} unread` : label}
        >
          {({ isActive }) => (
            <>
              <Icon filled={isActive} className="nav-bar__icon" />
              {to === '/chats' && unread > 0 && <span className="nav-bar__badge">{unread > 99 ? '99+' : unread}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
