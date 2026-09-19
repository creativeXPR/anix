import CloseIcon from '../icons/CloseIcon.jsx'
import ImageIcon from '../icons/ImageIcon.jsx'
import './FilePicker.css'

// A styled stand-in for a native <input type="file"> (which renders as
// an inconsistent OS-themed "Choose File" button + "No file chosen"
// text nothing else here matches) — the input itself stays in the DOM,
// visually hidden, and a <label for> triggers it, which works in every
// browser without JS.
//
// `existingLabel` covers the gap between "no file locally selected"
// (`file` is null, e.g. right after a successful upload resets it) and
// "nothing has ever been set" — without it, a caller that clears `file`
// once its own upload completes makes an already-uploaded banner look
// like it was never uploaded at all.
export default function FilePicker({
  id,
  file,
  onChange,
  label = 'Choose image',
  disabled,
  existingLabel,
}) {
  return (
    <div className="file-picker">
      <label
        htmlFor={id}
        className={`file-picker__btn${disabled ? ' file-picker__btn--disabled' : ''}`}
      >
        <ImageIcon />
        {label}
      </label>
      <span className="file-picker__name text-b3">
        {file ? file.name : existingLabel || 'No file chosen'}
      </span>
      {file && !disabled && (
        <button
          type="button"
          className="file-picker__clear"
          onClick={() => onChange(null)}
          aria-label="Remove file"
        >
          <CloseIcon />
        </button>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="file-picker__input"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  )
}
