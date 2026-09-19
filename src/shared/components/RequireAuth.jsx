import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '../auth-store.js'

// Home/Chats/Profile all need a signed-in account (creating your one room,
// owning your message link, an inbox to protect) — the chat room and
// anonymous-message-send screens deliberately stay outside this, since
// those must stay reachable by anonymous visitors with just a link.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuthUser()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />

  return children
}
