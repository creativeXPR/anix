import Spinner from './Spinner.jsx'
import './Button.css'

// `loading` shows a spinner and forces disabled — the single place this
// pending-state visual lives, so every async action gets the same
// treatment instead of each screen hand-rolling its own Spinner+text
// combo (or, as happened in a few places, forgetting to add one at all).
export default function Button({
  variant = 'primary',
  className = '',
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}
