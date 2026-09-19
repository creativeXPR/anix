import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const InstallContext = createContext({ canInstall: false, promptInstall: async () => {} })

// Captured once at the app root so both the floating popup (App.jsx)
// and the persistent card on Profile can react to the same underlying
// `beforeinstallprompt` event/dismissal state instead of each having
// their own (which is how the old single-component version worked and
// why the popup and Profile couldn't agree on whether install was
// available).
export function InstallProvider({ children }) {
  const [deferredEvent, setDeferredEvent] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function handleBeforeInstall(event) {
      event.preventDefault()
      setDeferredEvent(event)
    }
    function handleInstalled() {
      setInstalled(true)
      setDeferredEvent(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    setDeferredEvent(null)
  }, [deferredEvent])

  return (
    <InstallContext.Provider value={{ canInstall: !installed && Boolean(deferredEvent), promptInstall }}>
      {children}
    </InstallContext.Provider>
  )
}

export function useInstall() {
  return useContext(InstallContext)
}
