import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuthUser() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthUser must be used within AuthProvider')
  return context
}
