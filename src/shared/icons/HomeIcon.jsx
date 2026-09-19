// filled uses a dedicated solid glyph rather than just filling the outline
// paths — those are open stroke-lines, not closed shapes, so naive fill
// would render wrong.
export default function HomeIcon({ filled, ...props }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}
