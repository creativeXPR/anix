import { useTheme } from '../theme-store.js'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <label className="theme-toggle">
      <span className="text-b3">Dark mode</span>
      <input
        type="checkbox"
        className="theme-toggle__switch"
        checked={theme === 'dark'}
        onChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
    </label>
  )
}
