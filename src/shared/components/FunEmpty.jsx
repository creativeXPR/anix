import Button from './Button.jsx'
import './FunEmpty.css'

// #004-D: playful empty state with a CTA — big wobbling emoji, a cheeky
// heavy line, and a gradient button (NGL redesign). `cta`/`onClick` are
// optional for the purely informational case.
export default function FunEmpty({ emoji, title, text, cta, onClick, children }) {
  return (
    <div className="fun-empty pop-in">
      <span className="fun-empty__emoji" aria-hidden="true">
        {emoji}
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {cta && (
        <Button variant="grad" onClick={onClick}>
          {cta}
        </Button>
      )}
      {children}
    </div>
  )
}
