import './Spinner.css'

export default function Spinner({ size = 20 }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: size >= 32 ? 3 : 2 }}
      role="status"
      aria-label="Loading"
    />
  )
}
