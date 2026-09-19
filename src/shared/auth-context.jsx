import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { AuthContext } from './auth-store.js'
import { getFirebaseAuth } from './firebase.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
