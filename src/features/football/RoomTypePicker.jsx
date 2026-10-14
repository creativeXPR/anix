import { KITS } from '../rooms/kits.js'
import './football.css'

// Room type: "custom" is the original anonymous room; each other type
// switches on its kit (features/rooms/kits.js — badges, polls, stickers,
// football's live match card).
const ROOM_TYPES = Object.entries(KITS).map(([key, kit]) => ({ key, label: kit.label, hint: kit.hint }))

export default function RoomTypePicker({ value = 'custom', onChange, disabled }) {
  return (
    <div>
      <p className="section-label">
        room type <small>what it’s about</small>
      </p>
      <div className="room-type" role="radiogroup" aria-label="Room type">
        {ROOM_TYPES.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={value === t.key} onClick={() => onChange(t.key)} disabled={disabled}>
            {t.label}
            <small>{t.hint}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
