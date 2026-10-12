import { ROOM_EMOJI } from '../room-defaults.js'

// One-row emoji choice for a room (create sheet + room settings).
export default function EmojiPicker({ value, onChange, disabled }) {
  return (
    <div>
      <p className="section-label">pick an emoji</p>
      <div className="emoji-picker" role="radiogroup" aria-label="Room emoji">
        {ROOM_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={value === emoji}
            className="emoji-picker__option"
            onClick={() => onChange(emoji)}
            disabled={disabled}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
