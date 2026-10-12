import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)
// v2: light became the default (2026-10-12) and the old key held "dark"
// for everyone, so it's ignored rather than migrated. Keep in sync with
// the pre-paint script in index.html / functions/index-template.html.
export const THEME_STORAGE_KEY = 'anix:theme-v2'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
