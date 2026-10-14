import './football.css'

// Room type (2026-10-13): "custom" is the original anonymous room;
// "football" switches on the football kit (fan badges, polls; match
// card + stickers later). More niches (anime, weird stories) slot in here.
const ROOM_TYPES = [
  { key: 'custom', label: '💬 Custom', hint: 'chat about anything' },
  { key: 'football', label: '⚽ Football', hint: 'live match, badges & polls' },
]

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
