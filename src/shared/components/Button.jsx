import Spinner from './Spinner.jsx'
import './Button.css'

// `loading` shows a spinner and forces disabled — the single place this
// pending-state visual lives, so every async action gets the same
// treatment instead of each screen hand-rolling its own Spinner+text
// combo (or, as happened in a few places, forgetting to add one at all).
// variant: primary | grad | secondary | danger (see Button.css);
// size: 'sm' for in-card actions; block: full-width 56px (sheet CTAs).
export default function Button({
  variant = 'primary',
  size,
  block = false,
  className = '',
  loading = false,
  disabled,
  children,
  ...props
}) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
  return (
    <button type="button" className={classes.filter(Boolean).join(' ')} disabled={disabled || loading} {...props}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}
