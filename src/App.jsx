import { Outlet, Route, Routes } from 'react-router-dom'
import AdminApp from './features/admin/AdminApp.jsx'
import AnonymousMessageScreen from './features/anonymous-messages/AnonymousMessageScreen.jsx'
import AuthScreen from './features/auth/AuthScreen.jsx'
import ChatRoomScreen from './features/chatroom/ChatRoomScreen.jsx'
import HomeScreen from './features/home/HomeScreen.jsx'
import InboxScreen from './features/inbox/InboxScreen.jsx'
import ProfileScreen from './features/profile/ProfileScreen.jsx'
import AppShell from './shared/components/AppShell.jsx'
import InstallCard from './shared/components/InstallCard.jsx'
import RequireAuth from './shared/components/RequireAuth.jsx'
import './App.css'

// Auth, the chat room, and the anonymous-message-send screen stay outside
// the nav shell/auth gate — auth has nothing to navigate to before signing
// in, and both /r/:roomId and /m/:userId must stay reachable by anonymous
// link visitors with no account. Home/Chats/Profile need a real account
// (your one room, your message link, your inbox), so they're gated.
function AppShellLayout() {
  return (
    <AppShell>
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    </AppShell>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        {/* :handle is a cosmetic trailing segment for readability (e.g.
            /r/uu23g/movie-night) — never read by the app, only :roomId/
            :userId (the actual code) is. Optional so the bare code alone
            (/r/uu23g) is a valid link too. */}
        <Route path="/r/:roomId/:handle?" element={<ChatRoomScreen />} />
        <Route path="/m/:userId/:handle?" element={<AnonymousMessageScreen />} />
        {/* Passcode-gated, no real Anix account needed — see AdminApp.jsx
            and firestore.rules' admin/adminUnlocks section. */}
        <Route path="/admin" element={<AdminApp />} />
        <Route element={<AppShellLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/chats" element={<InboxScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
      </Routes>
      <InstallCard floating dismissible />
    </>
  )
}

export default App
