import { NavLink } from 'react-router-dom'
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
          aria-label={label}
        >
          {({ isActive }) => <Icon filled={isActive} className="nav-bar__icon" />}
        </NavLink>
      ))}
    </nav>
  )
}
