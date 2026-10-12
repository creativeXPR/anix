import { gameOf, headerOf } from '../games.js'
import './MessageCard.css'

// One anonymous message, rendered the way NGL does it: a header band in
// the game's own gradient carrying the game's title (or a custom/legacy
// prompt), over a white body with the message in heavy centered type.
// Deliberately white-bodied in both app themes — it's the "card you'd
// screenshot", the same object the share image draws (message-image.js).
// `message` supplies the text + the game/prompt it snapshotted when sent;
// messages from before games existed show the original "send me
// anonymous messages!" header in brand purple (see games.js).
export default function MessageCard({ message, footer, className = '', style, onClick }) {
  const game = gameOf(message.game)
  const header = headerOf(message)
  const Tag = onClick ? 'button' : 'article'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`message-card${onClick ? ' message-card--button' : ''} ${className}`.trim()}
      style={{ '--msg-from': game.colors[0], '--msg-to': game.colors[1], ...style }}
      onClick={onClick}
    >
      <span className={`message-card__header game-title${message.game && game.loud ? ' game-title--loud' : ''}`}>
        {header}
      </span>
      <span className="message-card__text">{message.text}</span>
      {footer && <span className="message-card__footer">{footer}</span>}
    </Tag>
  )
}
