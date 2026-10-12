import { useEffect } from 'react'

// Sets the tab title for a /welcome page and starts it at the top.
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    window.scrollTo(0, 0)
    return () => {
      document.title = previous
    }
  }, [title])
}
