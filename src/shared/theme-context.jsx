import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, ThemeContext } from './theme-store.js'

function getInitialTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    // Dark is the unattributed default (see index.css) — only light needs
    // the attribute set.
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Private/locked-down browser — theme just won't persist, not worth failing over.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
