import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { AuthContext } from './auth-store.js'
import { getFirebaseAuth } from './firebase.js'

// `user` is a real account only — an anonymous session (room guests get
// one silently; /admin uses one) never counts as "signed in" for Home,
// inbox, profile etc. `anyUser` includes it, for rooms (2026-10-14).
export function AuthProvider({ children }) {
  const [anyUser, setAnyUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setAnyUser(nextUser)
      setLoading(false)
    })
  }, [])

  const user = anyUser && !anyUser.isAnonymous ? anyUser : null
  return <AuthContext.Provider value={{ user, anyUser, loading }}>{children}</AuthContext.Provider>
}
