import { useTheme } from '../theme-store.js'

// A settings row (Profile): dark mode on/off. Light is the default.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="settings-row">
      <span className="settings-row__emoji" aria-hidden="true">
        🌙
      </span>
      <b>dark mode</b>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={theme === 'dark'}
        aria-label="Dark mode"
        onClick={toggleTheme}
      />
    </div>
  )
}
