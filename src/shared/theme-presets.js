// Per-room/per-link color themes. `null` = the brand purple (the default).
// Violet (#b433c8) was dropped in the NGL redesign as too close to the new
// default; docs that already store it still render, it's just not offered.
export const THEME_PRESETS = [
  { label: 'Default', value: null },
  { label: 'Pink', value: '#ff3d7c' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f97316' },
]
