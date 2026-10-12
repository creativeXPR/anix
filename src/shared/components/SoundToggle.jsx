import { useState } from 'react'
import { setSoundsEnabled, soundsEnabled } from '../sounds.js'

// A settings row (Profile): the in-app "pop" for new messages/replies.
// Turning it on plays a pop so you hear what you're enabling.
export default function SoundToggle() {
  const [enabled, setEnabled] = useState(soundsEnabled)

  return (
    <div className="settings-row">
      <span className="settings-row__emoji" aria-hidden="true">
        🔊
      </span>
      <b>sounds</b>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={enabled}
        aria-label="In-app sounds"
        onClick={() => {
          setSoundsEnabled(!enabled)
          setEnabled(!enabled)
        }}
      />
    </div>
  )
}
