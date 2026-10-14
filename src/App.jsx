import { useGuestStickerMigration } from './features/stickers/use-sticker-migration.js'
import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import AppShell from './shared/components/AppShell.jsx'
import InstallCard from './shared/components/InstallCard.jsx'
import RequireAuth from './shared/components/RequireAuth.jsx'
import './App.css'

// Every screen loads on demand (bundle split, 2026-10-14) — someone opening
// a shared /m/ or /r/ link downloads only that screen, not the whole app.
const AdminApp = lazy(() => import('./features/admin/AdminApp.jsx'))
const AnonymousMessageScreen = lazy(() => import('./features/anonymous-messages/AnonymousMessageScreen.jsx'))
const AuthScreen = lazy(() => import('./features/auth/AuthScreen.jsx'))
const ChatRoomScreen = lazy(() => import('./features/chatroom/ChatRoomScreen.jsx'))
const HomeScreen = lazy(() => import('./features/home/HomeScreen.jsx'))
const InboxScreen = lazy(() => import('./features/inbox/InboxScreen.jsx'))
const ProfileScreen = lazy(() => import('./features/profile/ProfileScreen.jsx'))
const ThreadScreen = lazy(() => import('./features/threads/ThreadScreen.jsx'))
const WelcomeHome = lazy(() => import('./features/welcome/WelcomeHome.jsx'))
const AboutPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.ContactPage })))
const GuidelinesPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.GuidelinesPage })))
const PrivacyPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.PrivacyPage })))
const SafetyPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.SafetyPage })))
const TermsPage = lazy(() => import('./features/welcome/WelcomePages.jsx').then((m) => ({ default: m.TermsPage })))

// Auth, the chat room, and the anonymous-message-send screen stay outside
// the nav shell/auth gate — auth has nothing to navigate to before signing
// in, and both /r/:roomId and /m/:userId must stay reachable by anonymous
// link visitors with no account. Home/Chats/Profile need a real account
// (your one room, your message link, your inbox), so they're gated.
// While a screen's code downloads: a quiet shimmer bar at the top instead
// of a blank page (screens show their own skeletons once loaded).
function RouteLoading() {
  return <div className="route-loading" role="progressbar" aria-label="Loading" />
}

function AppShellLayout() {
  return (
    <AppShell>
      <RequireAuth>
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </RequireAuth>
    </AppShell>
  )
}

function App() {
  useGuestStickerMigration()
  return (
    <>
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        {/* Public site (no account needed). Only reached by linking to it
            directly — the root still sends signed-out visitors to /auth. */}
        <Route path="/welcome" element={<WelcomeHome />} />
        <Route path="/welcome/about" element={<AboutPage />} />
        <Route path="/welcome/safety" element={<SafetyPage />} />
        <Route path="/welcome/contact" element={<ContactPage />} />
        <Route path="/welcome/terms" element={<TermsPage />} />
        <Route path="/welcome/privacy" element={<PrivacyPage />} />
        <Route path="/welcome/guidelines" element={<GuidelinesPage />} />
        {/* :handle is a cosmetic trailing segment for readability (e.g.
            /r/uu23g/movie-night) — never read by the app, only :roomId/
            :userId (the actual code) is. Optional so the bare code alone
            (/r/uu23g) is a valid link too. */}
        <Route path="/r/:roomId/:handle?" element={<ChatRoomScreen />} />
        <Route path="/m/:userId/:handle?" element={<AnonymousMessageScreen />} />
        {/* Private anonymous conversation (phase 2) — outside the auth gate:
            the sender has no account; the secret id is their way in. */}
        <Route path="/t/:threadId" element={<ThreadScreen />} />
        {/* Passcode-gated, no real Anix account needed — see AdminApp.jsx
            and firestore.rules' admin/adminUnlocks section. */}
        <Route path="/admin" element={<AdminApp />} />
        <Route element={<AppShellLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/chats" element={<InboxScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
      </Routes>
      </Suspense>
      <InstallCard floating dismissible />
    </>
  )
}

export default App
