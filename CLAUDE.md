# Anix

Anonymous social app (anonymous chat rooms + anonymous messages, à la NGL)
with seasonal theme customization. Full concept and workflow are in the main
conversation history; the durable facts worth keeping here are below.

For design/architecture decisions, use the Design Playbook at
`C:\Users\Extra\Documents\code\Stores\CLAUDE.md` — topics #001 (layout),
#002 (chat room), #003 (color/type), #004 (icons/loaders/motion), #005
(scaffolding), #008 (Firebase integration). This file only covers
Anix-specific facts that aren't derivable by reading the code.

## Stack (decided via Design Playbook #005, 2026-09-18)

- React 19 + Vite, plain CSS (no framework) — matches the Anime-space
  project's approach.
- Firebase (client SDK) for backend — config read from `VITE_FIREBASE_*`
  env vars in `src/shared/firebase.js`.
- `react-router-dom` for routing.
- `browser-image-compression` — for the chat room's image-post feature.
- Minimal-dependencies philosophy: hand-roll before reaching for a library.
- npm (matches the committed `package-lock.json`).

## Conventions

- Feature-based folders under `src/features/`, shared code under
  `src/shared/`.
- PascalCase components, kebab-case everything else.
- Comment philosophy for this project: more explanatory than the general
  default, especially around the anonymous-id scheme and anything
  Firestore-shaped, since that logic isn't self-evident from naming alone.
- "Anix" is the final name (not a working title) — safe to bake into
  package name, etc. **Correction (#008, 2026-09-19)**: Anix does *not*
  get its own Firebase project id — it shares the existing `c-xpr25`
  project via a named Firestore database (`anix`) and a shared Storage
  bucket (`anix/` prefix). See the Firebase Integration section below.

## Anonymous-id scheme

`src/shared/utils/anonymous-id.js` generates a 6-character id (alphabet
excludes `0/O/1/I` to avoid ambiguity), assigned client-side per room via
`useAnonymousParticipant` and persisted in `localStorage` so a refresh
keeps the same identity mid-conversation. Written directly onto each
message's `senderId` field (see the data model in the #002 section below)
— no server-side assignment.

## Data model

See the #002 section below for the full Firestore shape
(`rooms/{roomId}/messages`, `/typing`, `/reports`) and the #008 section
for the security rules and named-database setup.

## Responsive layout (decided via Design Playbook #001, 2026-09-18)

- Three tiers, tracked in `src/shared/breakpoints.js` / `use-viewport-tier.js`:
  mobile `<600px`, tablet `600-899px`, desktop `900px+` — same values as
  Anime-space. Tracked in JS (not just CSS `@media`) because the component
  tree itself changes shape across these boundaries, not just styling.
- **Nav**: `NavBar` (`src/shared/components/NavBar.jsx`) — one component,
  two orientations via a prop, same pattern as Anime-space: bottom bar on
  mobile/tablet, vertical rail (76px) on desktop, rendered by `AppShell`.
  Icon-only at every tier (no labels), active item gets a background-pill
  highlight. Currently only has a Home item — extend `NAV_ITEMS` as more
  nav-worthy screens (e.g. profile) get built. `AuthScreen` and
  `ChatRoomScreen` both render outside `AppShell` — auth has nothing to
  navigate to pre-login, and a chat room is a full-bleed experience for
  link visitors, not wrapped in the app's persistent nav (revised
  2026-09-19; it was briefly inside the shell). Only `HomeScreen` and
  `AnonymousMessageScreen` are nested under the `AppShellLayout` route in
  `App.jsx`.
- **Layout structure**: mobile is single-screen stack/swap (no side-by-side
  content). Anix has no persistent "list of rooms" to browse (rooms are
  opened directly via link) so there's no Anime-space-style list+detail
  pane — the one place a second pane exists is the chat room's settings/
  season-theme panel: inline beside the chat at tablet/desktop
  (`ChatRoomScreen.jsx`, `.chat-room__settings`), a full-screen overlay
  toggled by a settings-icon button on mobile.
- **Icons**: custom inline SVG under `src/shared/icons/`, outline style,
  `viewBox 24 24`, `strokeWidth 2`, round caps/joins (Feather/Lucide-style,
  matching Anime-space). 20px in nav at mobile/tablet, 22px at desktop;
  44px minimum tap target on interactive icon buttons.
- **Spacing**: no spacing-scale tokens — hand-picked even numbers per
  component (8/12/16/24px seen so far), tighter on mobile and roomier at
  the 900px desktop tier via `@media (min-width: 900px)` bumps.
- **Chrome**: no fake mobile status bar, no decorative device frame at any
  width — the real viewport always fills edge-to-edge. `viewport-fit=cover`
  is set in `index.html` and the bottom nav bar pads for
  `env(safe-area-inset-bottom)`, since Anix is installable as a PWA.
- **Tier transitions**: state persists across a breakpoint crossing for
  free (it's the same mounted route component, only `AppShell`'s chosen
  nav orientation changes) — no reset-to-home behavior. Layout swaps are
  instant, no transition animation on tier change.

## Chat room design & functionality (decided via Design Playbook #002, 2026-09-19)

- **Bubbles** (`src/features/chatroom/components/MessageBubble.jsx`): own
  right-aligned / other left-aligned, one mirrored component; own bubble
  gets an accent-tinted background, other stays neutral; flattened corner
  nearest the sender's side as a tail cue; `max-width: min(78vw, 480px)`.
- **Grouping/identity**: consecutive same-sender messages collapse the
  header. No usernames exist — a participant is `Guest <anonymous-id>`, and
  `src/shared/utils/participant-color.js` hashes the id to a fixed color
  from a curated palette (swap the palette once Anix has a real accent).
- **Reply/quote**: compact quote strip above the bubble, tap jumps to and
  highlights the original (`onJumpToReply` in `ChatRoomScreen.jsx`), and
  it's a **snapshot** of the original text/sender — not a live reference.
- **Message actions**: Copy / Reply / Report only — deliberately no
  edit/delete/react, since editing history doesn't fit an anonymous,
  ephemeral message. Tap-to-reveal, popping in with the same overshoot
  easing Anime-space reserves for this (`0.22s cubic-bezier(0.34, 1.56,
  0.64, 1)`).
- **Composer** (`components/Composer.jsx`): image attach (compressed via
  `browser-image-compression`, uploaded through `upload-image.js`) +
  auto-detected links (`linkify.js` renders a hostname-only chip — a real
  fetched OG-preview needs a server-side unfurl, not built). Enter sends,
  Shift+Enter newlines, send button always present.
- **Realtime sync** (`messages.js`): Firestore `onSnapshot` on
  `rooms/{roomId}/messages`, optimistic-feeling send (Firestore's own
  local-cache echo), ordered by `serverTimestamp()`.
- **Pagination**: ~30-message pages, older messages load on scroll-near-
  top, scroll position is compensated on prepend so it doesn't jump.
  Auto-scroll to newest only when already near the bottom.
- **Data model**: `rooms/{roomId}` (`createdAt`, `lastActivityAt`) →
  `rooms/{roomId}/messages/{id}` (`text`, `senderId`, `createdAt`,
  `replyTo` snapshot or null, `imageUrl` or null) → `rooms/{roomId}/reports`
  and `rooms/{roomId}/typing/{participantId}` as separate subcollections.
  Auto-expiry of inactive rooms — **resolved in #008**:
  `functions/expireInactiveRooms` is a scheduled Cloud Function (every 24h,
  7-day inactivity threshold) that deletes a room's subcollections, its
  Storage images, and the room doc itself.
- **Presence/moderation**: typing indicator is aggregate-only ("3 people
  typing"), never per-id. Unread state is a local `lastVisitAt` per room
  (`shared/utils/room-visits.js`) driving a one-time "New messages"
  divider — no per-message read receipts. Rate limiting
  (`MIN_SEND_INTERVAL_MS` in `messages.js`) is still only a client-side
  speed bump — `firestore.rules` (added in #008) controls *access*
  (room-scoped, no enumeration) but doesn't add server-side rate limiting;
  a modified client could still send faster than the UI allows. **Still a
  follow-up** if that turns out to matter (e.g. a Cloud Function counting
  recent messages per participant).
- **Entry point**: `HomeScreen` now has a working "Open a new chat room"
  button that calls `createRoom()` and navigates to `/r/:roomId` — this
  wasn't explicitly asked for in #002 but the room feature needed a real
  way to reach it to be testable.
- Verified with Playwright against the dev server (home + room screens,
  mobile + desktop) — renders correctly, no console errors. Room
  creation itself can't complete without real Firebase credentials in
  `.env` (confirmed: it fails gracefully, no crash, just stays on
  "Opening…").

## Color/design system (decided via Design Playbook #003, 2026-09-19)

Based on Stores/CLAUDE.md entry **003-27** (full dark/purple design-system
spec sheet, Poppins) — chosen over 003-08 (neon black) and 003-07 (dark
hero + glass form) as the most literally reusable entry. **Recolored**:
the user asked for the theme to orient around `#b433c8` instead of
003-27's original violet ramp, so the primary 3-step ramp below is derived
from that hex (light/dark computed via HSL), not copied from the entry.
All tokens live in `src/index.css`.

- **Primary ramp**: `--primary-light:#d490df` `--primary:#b433c8`
  `--primary-dark:#6e1f7a`. `--accent`/`--accent-bg`/`--accent-border`
  alias to this, so components built during #001/#002 that already
  referenced `--accent` (NavBar active pill, own-message bubble, the
  chat-room settings overlay) picked up real color with no edits needed.
- **Pastel** (5-swatch, harmonized with the new primary rather than
  003-27's original lavender/cream/pink/sky-blue/blush):
  `--pastel-lavender-pink:#e8c6f0` `--pastel-cream:#fff6e9`
  `--pastel-pink:#f7b8d8` `--pastel-sky:#b8d4f7` `--pastel-blush:#f7dde0`.
  Not wired into any component yet — declared for when a use appears.
- **Neutrals**: a three-step dark surface ladder like Anime-space's
  (`--bg:#120a16` → `--panel:#1c1220` → `--panel-alt:#241631`), plus
  `--border:#33253b` `--text:#c9c0cf` `--text-h:#f6f1f8`
  `--text-muted:#8d8393`. `--panel`/`--panel-alt`/`--text-muted` are
  declared but not yet used anywhere — nothing in Anix needs a second
  surface level yet.
- **Secondary**: `--secondary-green:#3ecf8e` `--secondary-green-alt:#2a9d6f`
  `--secondary-pink:#ff6fa5` `--secondary-magenta:#e0479f` — carried over
  from 003-27's "two greens, pink, magenta" field as available accents,
  not yet bound to semantic meaning (e.g. a future toast system, #004,
  would decide whether green means success here).
- **Typography**: Poppins (loaded via Google Fonts link in `index.html`)
  end to end, weight-differentiated scale per 003-27 — H1 40/H2 24/H3
  18/H4 16 all semibold (600), plus utility classes `.text-b1`–`.text-b4`
  for the 14/14/14/12px body scale (B1 semibold, B2 medium, B3 regular,
  B4 regular) since body text isn't uniformly wrapped in one tag.
- **Buttons**: new `src/shared/components/Button.jsx` (`variant="primary"
  | "secondary"`) with explicit default/hover/pressed(`:active`
  scale-down)/disabled states, matching 003-27's explicit-states
  discipline. Used by Home's "Open a new chat room" and the composer's
  Send button; nothing else needs a button yet.
- **Light mode, revised 2026-09-19**: initially dropped (see git history/
  prior note), then reinstated per explicit request — but as a
  user-controlled toggle on the new `ProfileScreen`, not OS-driven
  `prefers-color-scheme`. `:root[data-theme='light']` in `index.css` is a
  hand-authored counterpart to the dark tokens (003-27 didn't document
  one). `src/shared/theme-store.js` (context + `useTheme` hook) and
  `theme-context.jsx` (`ThemeProvider`, wraps the app in `main.jsx`)
  persist the choice to `localStorage` (`anix:theme`) and toggle a
  `data-theme` attribute on `<html>`; an inline script in `index.html`
  applies it before first paint to avoid a flash of the wrong theme.
  `ThemeToggle` (`shared/components/`) is the switch UI, used by
  `ProfileScreen`. The "season theme" feature is still the mechanism for
  richer per-room theming beyond this binary light/dark choice.
- **New Profile screen**: `src/features/profile/ProfileScreen.jsx`, added
  to `NavBar`'s `NAV_ITEMS` (`ProfileIcon`) and routed at `/profile`
  inside `AppShellLayout`. Currently only holds the theme toggle — no
  actual account/profile data exists yet (Anix has no persistent user
  accounts to show).
- **Not yet built**: 003-27 also documents toggle/radio/checkbox and an
  input field with icon-prefix + label/typing/typed/error states, and
  card variants (task-list, stat/summary with a colored left accent bar).
  Anix has no forms or dashboard screens yet that need these — apply the
  same states/token discipline when `AuthScreen` or a settings form
  actually gets built, rather than building unused components now.
- Verified with Playwright screenshots (home + chat room, dark theme,
  Poppins loading, accent visible on nav/buttons/bubbles) — no console
  errors.

## PWA

**Real brand icon, 2026-09-19**: the placeholder letter-mark favicon
(`public/favicon.svg`, dark square + white "A") is gone, replaced by the
user's actual icon — a ghost mark on lavender, `C:\Users\Extra\Documents\UIUX\anix icon.jpg`
(736×736, copied to `public/icon.jpg`). Used for the browser favicon,
`apple-touch-icon`, the `og:image`/`twitter:image` link-preview meta
tags, `public/manifest.json`'s single icon entry, and `Page`'s
`page__logo` badge (Home's header brand mark — previously a plain "A"
square, now this image). `manifest.json`'s `background_color`/
`theme_color` stay the app's actual dark UI color (`#120a16`), not the
icon art's own lavender background — those describe the app chrome, not
the icon.

## Icons, loaders, placeholders & motion (decided via Design Playbook #004, 2026-09-19)

- **Icon variants**: nav icons (`HomeIcon`, `ProfileIcon`) now take a
  `filled` prop — `NavBar` passes `filled={isActive}` via `NavLink`'s
  render-prop form. Filled variants are **dedicated solid glyphs**, not
  the outline paths with fill swapped on — `HomeIcon`'s outline paths are
  open stroke-lines that don't fill cleanly, so its filled variant is a
  separate Material-style solid house path. `ProfileIcon`'s outline paths
  happen to close into a sensible silhouette when filled, so its filled
  variant reuses the same path data. Large icons (empty states) are
  48-64px, same strokeWidth-2 outline language, no separate large-icon
  style.
- **Loading**: `Spinner` (`shared/components/`) — accent-colored ring,
  1s linear rotation, used inline in `Button` for a pending action (e.g.
  Home's "Opening…"). No full-page spinner or progress bar anywhere.
  No minimum display time — shown exactly as long as the wait is.
- **Skeletons**: `MessageSkeleton` (`features/chatroom/components/`)
  mirrors `MessageBubble`'s row/alignment shape (reuses `.bubble-row`/
  `.bubble-row--own`), pulses opacity 0.5↔1 over 1.4s (same timing as
  Anime-space), tinted `--accent-bg` rather than neutral gray so it reads
  as branded. Per-component granularity — `ChatRoomScreen` shows 3
  skeleton rows only in its message list while `initialLoading` is true;
  header/composer render immediately, never swallowed into a whole-screen
  skeleton.
- **Empty states**: `EmptyState` (`shared/components/`) — icon (48-64px,
  `text-muted` colored) + functional copy, no CTA (the composer is
  already on screen). Used once so far: `ChatRoomScreen` shows it with
  `MessageIcon` once Firestore confirms zero messages — distinct from the
  skeleton, which only shows during `initialLoading`, so "loading" and
  "confirmed empty" never get confused with each other.
- **Motion tokens**: `--duration-fast`/`--ease-standard` (0.15s ease, most
  hover/color transitions — nav active state, buttons, theme toggle) and
  `--duration-bounce`/`--ease-bounce` (0.22s cubic-bezier overshoot) in
  `index.css`, reused everywhere instead of hand-tuned per component. The
  bounce pair stays reserved for the one signature moment — the
  bubble-action tap-to-reveal pop — matching Anime-space's philosophy of
  one deliberate accent rather than bounce everywhere.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables
  the bubble-action bounce and the skeleton pulse (falls back to a static
  0.75 opacity). The Spinner is intentionally **not** covered — an
  indeterminate loading spinner needs some motion to mean anything, so it
  keeps animating regardless of the preference.
- **Screen transitions**: instant, no animation — React Router's default,
  no transition library. Matches the #001-G call for tier changes,
  extended here to route changes generally.
- Verified with Playwright (skeleton mid-pulse, filled-vs-outline nav
  icons on Home vs Profile, button spinner during a pending create) — no
  console errors.

## Firebase integration (decided via Design Playbook #008, 2026-09-19)

- **Shared project, not Anix's own**: Anix lives inside the existing
  **`c-xpr25`** Firebase project (the user's own multi-app project — real
  config given directly in conversation on 2026-09-19), not a dedicated
  project of its own. **Correction**: this was initially assumed to be
  `animespace-12` (Anime-space's project, found in its `.firebaserc`) —
  that was wrong; `c-xpr25` is a separate project, unrelated to
  Anime-space. `.env` (gitignored, real values) and `.firebaserc` both
  point at `c-xpr25`; `.env.example` documents the required keys.
- **Named Firestore database**: `src/shared/firebase.js` calls
  `getFirestore(firebaseApp, 'anix')` — a *named* database, not the
  project's default one. This, not the project id, is what actually
  separates Anix's data from other apps sharing the project.
- **Shared Storage bucket, `anix/` prefix**: Storage has no equivalent
  "named database" feature, so `upload-image.js` writes to
  `anix/rooms/{roomId}/images/...` instead of a dedicated bucket.
- **Firebase project files** (new, at `anix/anix/` root): `.firebaserc`
  (points at `c-xpr25`), `firebase.json` (multi-database Firestore
  target for `anix`, storage rules, hosting → `dist` with an SPA rewrite,
  functions source), `firestore.rules`, `storage.rules`,
  `firestore.indexes.json` (empty so far).
- **Security rules** (`firestore.rules`/`storage.rules`): room-scoped open
  access — anyone who already has a room's id (its link) can read/write
  that room's data, matching the link-sharing model; there's no per-user
  ownership check since participants are anonymous. Critically, the
  top-level `rooms` collection **cannot be listed** (`allow list: if
  false`), so a room is only reachable by already knowing its link, never
  by enumeration. Messages are create-only from the client (no
  update/delete, matching #002's no-edit decision); reports are
  create-only (only readable via the Admin SDK). Storage writes are
  additionally capped at 5MB and must be `image/*`, enforced server-side
  as defense in depth beyond the client-side compression.
- **Cloud Function**: `functions/index.js` — `expireInactiveRooms`, a
  scheduled function (every 24h) implementing the room-retention policy
  #002 flagged as unresolved. Deletes a room's `messages`/`typing`/
  `reports` subcollections, its Storage images (by the `anix/` prefix),
  then the room doc, for any room whose `lastActivityAt` is older than
  `INACTIVE_DAYS` (**2 days**, changed from an initial 7 on 2026-09-19 per
  explicit request). Uses the Admin SDK against the same named `anix`
  database, which bypasses `firestore.rules` entirely (expected — client
  rules deliberately don't allow room deletion themselves). **Deployed**
  2026-09-19 (`firebase deploy --only functions`, same
  `NODE_OPTIONS="--dns-result-order=ipv4first"` fix as the rules deploy;
  also needed `functions/node_modules` installed first — the first
  install attempt failed mid-way with `ECONNRESET`, leaving a broken empty
  `node_modules` that had to be removed and reinstalled clean). Confirmed
  live via `firebase functions:list`: `expireInactiveRooms`, v2,
  scheduled, `us-central1`. Artifact Registry cleanup policy also set
  (`firebase functions:artifacts:setpolicy`, 2026-09-19) — build images
  older than 1 day now auto-delete, closing the earlier non-fatal deploy
  warning.
- **Hosting**: deployed 2026-09-19 (`npm run build` then
  `firebase deploy --only hosting`) to the `anix` Hosting site —
  **live at https://anix.web.app**. Verified with Playwright directly
  against that production URL: home loads, "Open a new chat room"
  navigates to a real `/r/:roomId`, empty state and settings panel render
  correctly, zero console errors. `firebase.json`'s SPA rewrite
  (`**` → `/index.html`) is doing its job — direct room/message links
  will resolve correctly too, not just navigation from within the app.
- **Auth**: real account system built — `AuthScreen.jsx` now has working
  email/password sign-in **and** sign-up (toggled via a `mode` state) plus
  a Google sign-in button, wired to Firebase Auth
  (`signInWithEmailAndPassword`/`createUserWithEmailAndPassword`/
  `signInWithPopup`). This is separate from the per-room anonymous-id
  scheme — it's the account that would own a persistent profile /
  anonymous-message link, not chat-room identity. Firebase's own
  `signInAnonymously` is deliberately **not** used anywhere; the existing
  `generateAnonymousId()` + `localStorage` approach already covers
  chat-room anonymity without a redundant second identity layer.
- **Bug found and fixed during this pass**: `getAuth()` validates the API
  key *synchronously* and throws if it's missing/invalid — unlike
  `getFirestore()`/`getStorage()`, which fail lazily. Exporting `auth` as
  an eager module-level constant (the initial implementation) crashed
  **every** screen at import time, not just the auth screen, while `.env`
  is unfilled. Fixed by making it lazy:
  `getFirebaseAuth()` in `firebase.js` only calls `getAuth()` on first
  actual use, called from inside `AuthScreen`'s submit handlers (which
  already catch and display the error) — never at module scope or during
  render. Verified via Playwright across all 5 routes with zero console
  errors after the fix.
- One thing **not** addressed here: `MIN_SEND_INTERVAL_MS`'s client-side
  rate limiting still has no server-side backing (see the #002 section's
  updated follow-up note above).
- **Real credentials wired + rules deployed, 2026-09-19**: the user gave
  real `c-xpr25` client config directly in chat; `.env` (gitignored) now
  has it. First live test (before deploying) correctly failed with
  "Missing or insufficient permissions" — `firestore.rules`/
  `storage.rules` were authored locally back in the earlier #008 pass but
  had never been deployed. With the user's explicit go-ahead,
  `firebase deploy --only firestore:rules` and `--only storage` were run
  and both succeeded. **Re-verified end-to-end with Playwright**: create
  room → navigates to `/r/:roomId` → send a message → renders as a real
  Firestore-synced bubble, zero console errors. Anix is now fully working
  against live Firebase, not just locally-plausible code.
  - **Deploy gotcha worth remembering**: `firebase deploy` from this
    machine hangs/times out (`ConnectTimeoutError` to
    `*.googleapis.com`) unless run with
    `NODE_OPTIONS="--dns-result-order=ipv4first"` — Node's default
    IPv6-first DNS resolution stalls here even though plain `curl` to the
    same hosts resolves fine. Also: `--only storage:rules` fails with
    "Could not find rules for the following storage targets: rules" on
    this single-bucket (non-multi-target) `firebase.json` — use
    `--only storage` instead.
  - Also found and fixed in the same pass: `HomeScreen.handleCreateRoom`
    had no try/catch, so a `createRoom()` failure (like the pre-deploy
    permissions error) left the UI stuck on "Opening…" forever with the
    button permanently disabled — now shows the error and re-enables the
    button (`.error-text` utility class in `index.css`, also adopted by
    `AuthScreen` in place of its own duplicate rule).
  - One test room (`P2YYB9UQ`, one test message) existed briefly in the
    live `anix` database from this verification pass — **superseded by
    the 2026-09-19 rebuild below**, which replaced random-id rooms
    entirely with one permanent room per account.

## Real product build-out (2026-09-19, after live-testing exposed the gaps)

The first live look at the deployed site (by the user, not caught in any
prior Playwright pass) found the core UX simply hadn't been built despite
everything above being "done": no way to reach `/auth` from anywhere in
the UI, an empty Profile, no nav item for anonymous messages, and the
anonymous-messages feature — one of the three features described at the
very start — was never actually implemented (just a placeholder heading).
This section is the real fix, built to match Anime-space's actual UI
patterns (flat cards, no shadows, `--panel`/`--panel-alt`, a toast for
copy/save feedback) per explicit request, not just matching its color
theme.

- **Auth gating**: `src/shared/auth-store.js` + `auth-context.jsx`
  (`AuthProvider`/`useAuthUser`, split into two files to satisfy the
  fast-refresh-only-exports-components lint rule — same pattern as
  `theme-store.js`) tracks `onAuthStateChanged`. `RequireAuth.jsx` wraps
  Home/Chats/Profile inside `AppShellLayout` and redirects to `/auth`
  (preserving the intended destination via router state) when signed out.
  `/r/:roomId` and `/m/:userId` deliberately stay **outside** this gate —
  anonymous link visitors must never need an account.
- **One room per account, not random rooms**: `createRoom()` is gone;
  `getOrCreateOwnRoom(uid)` in `messages.js` uses the owner's **uid as the
  roomId** (`rooms/{uid}`), created lazily with `status: 'open'`. This is
  why `firestore.rules`' room `create`/`update` can just check
  `request.auth.uid == roomId` — no separate `ownerId` field needed. A
  room can be toggled `open`/`closed` from Home (`setRoomStatus`); when
  closed, `ChatRoomScreen` disables the composer and shows a banner for
  everyone (enforced client-side only so far — not yet mirrored in
  `firestore.rules`, so a modified client could still post to a closed
  room; a real follow-up if that turns out to matter).
- **Presence**: `startPresenceHeartbeat(roomId, participantId)` writes/
  refreshes a `rooms/{roomId}/presence/{participantId}` doc every 20s
  while `ChatRoomScreen` is mounted (deletes it on unmount);
  `subscribeToPresenceCount` counts docs updated within the last 45s.
  Home's room card shows this as "N active" next to the open/closed dot.
- **Public user profiles**: `users/{uid}` (`src/shared/users.js`) holds
  just `{ displayName }` — `allow get: if true` (anyone with a uid can
  read it, needed so an anonymous sender on `/m/:userId` can show "Send
  *Name* a message"), `allow list: if false` (no enumerating users),
  write restricted to the owner. Set from Profile's display-name field.
- **Anonymous-messages feature, actually built**: `src/features/inbox/`
  — `inbox.js` (`sendAnonymousMessage`/`subscribeToInbox`, writing to
  `inboxes/{uid}/messages`, create-only from anyone, read-only by the
  owner) and `InboxScreen.jsx`, the "Chats" nav destination (route
  `/chats` — the nav label is "Chats" per explicit request even though
  it's really the anonymous-message inbox, not a room list).
  `AnonymousMessageScreen` at `/m/:userId` now actually sends (previously
  just a placeholder heading), showing the recipient's display name via
  `getPublicProfile`.
- **Share-as-image, NGL-style**: `src/shared/utils/message-image.js`
  draws a received message onto a 720×1280 canvas card (word-wrapped,
  capped at 12 lines) matching Anix's own dark/purple look, not a generic
  template. `InboxScreen`'s "Copy as image" tries
  `navigator.clipboard.write` with a `ClipboardItem` first (confirmed
  working — see the 2026-09-19 verification below), falling back to an
  `<a download>` if the browser doesn't support clipboard image writes.
- **Profile, filled in**: signed-in email + log-out, the message-link
  card (same copy-link pattern as Home), an editable display name, the
  existing dark-mode `ThemeToggle`, and a feedback form
  (`src/features/profile/feedback.js`, create-only `feedback` collection,
  no client can read it back — console/admin only).
- **New shared UI primitives**, all reused across Home/Chats/Profile:
  `Page.jsx`/`.css` (top-anchored header + scrollable content — replaces
  the vertically-centered `.screen` treatment for these three screens,
  which was never right for a list-of-cards layout; `.screen` itself
  stays for the genuinely centered ones — Auth, the anonymous-message
  composer), `Card.jsx`/`.css` (flat badge+title/subtitle+pill-actions
  card matching Anime-space's `.group-card`, recolored onto Anix's
  tokens — badge uses `--accent-bg`/`--primary` instead of Anime-space's
  gold), and `toast-store.js`/`toast.jsx` (same context/provider split
  pattern, fixed top-right, used for "Copied"/"Name saved"/"Image
  copied" feedback instead of Anime-space's own but differently-colored
  toast).
- **Real layout bug fixed**: `.screen`'s `min-height` was `100%`, which
  needs a sized ancestor to resolve against — fine inside `AppShell`'s
  flex content area, broken for `AuthScreen` (rendered standalone,
  outside `AppShell`), which showed top-anchored with a large dead gap
  below instead of centered. Changed to `100svh` (same fix already
  applied to `ChatRoomScreen` earlier) — resolves on its own regardless
  of ancestor, correct in both contexts.
- **Room title no longer shows the raw uid**: `ChatRoomScreen`'s header
  said literally "Room `<28-character-uid>`" — now just "Chat room".
- **`expireInactiveRooms` Cloud Function retired, replaced**: rooms
  becoming permanent per-account makes "delete a room after N quiet
  days" actively wrong — it would delete a user's permanent link/room
  just for being quiet. Replaced with `pruneStalePresence` (still
  scheduled every 24h) which only prunes stale `typing`/`presence` docs
  across all rooms — real hygiene, zero data-loss risk. The old function
  was deleted from `c-xpr25` with explicit user confirmation
  (`firebase functions:delete expireInactiveRooms --region us-central1
  --force` — the `--force` here is scoped to accepting *that specific,
  already-approved* deletion prompt, not a blanket bypass).
- **`firestore.rules` rewritten** for the new collections: `users/{uid}`,
  `inboxes/{uid}/messages`, `feedback`, `rooms/{roomId}/presence`, plus
  the room `create`/`update` rules now keying off `request.auth.uid ==
  roomId` (see above). `rooms/{roomId}/messages`, `/typing`, `/reports`
  are unchanged from the original #008 pass.
- **Verified end-to-end with Playwright against production
  (https://anix.web.app), 2026-09-19**: sign-up → redirected home →
  "Your room" card → enter room → send a message as the owner → Profile
  → set display name → save (toast) → a **separate, signed-out** browser
  context visits `/m/:uid` → sees the display name → sends an anonymous
  message → back on the owner's Chats page, the message appears →
  "Copy as image" → clipboard toast confirms success. Separately verified
  presence ("2 active" with two contexts in the same room) and the
  open/closed toggle (closing from Home immediately shows the disabled
  composer + banner for a second context already in the room). Zero
  console errors throughout. Rules-propagation delay was observed
  immediately after a rules deploy (~30-60s) — a same-second retest after
  deploying showed a stale permission-denied that a short wait resolved;
  worth remembering before concluding a fresh rules deploy is broken.

## Multi-room/multi-endpoint rebuild (2026-09-19, superseded the one-per-account model above)

Per explicit request, replaced "one permanent room + one message link per
account" with: **up to 3 rooms and up to 3 anonymous-message links per
account**, each user-named (a "handle"), closed by default, themeable,
with an optional banner image shown when the link is shared, and rooms
auto-expire after 2 days of inactivity (endpoints don't). Also: a
Home/Chats-nav restructure, a real optimistic-send fix, and hard lessons
about the dynamic-link-preview Cloud Function. The sections above this
one describing the old model (one room keyed by uid, `getOrCreateOwnRoom`,
`inboxes/{uid}`, public `users/{uid}` display names) are **historical,
not current** — read this section for what's actually there now.

- **Data model**: `rooms/{roomId}` and `messageEndpoints/{endpointId}`,
  where the id is the owner-chosen handle (lowercase, 3-24 chars,
  `[a-z0-9][a-z0-9-]*`) — not a random id, not the uid. Fields: `ownerId`,
  `handle`, `themeColor` (hex or null), `bannerImageUrl` (null = show the
  app icon), `createdAt`; rooms also have `status` (`'open'`|`'closed'`,
  **closed by default**) and `lastActivityAt`. Message subcollections
  under each are unchanged in shape from the earlier model.
- **Handle-uniqueness + the 3-cap can't be expressed in security rules**
  (rules can't count existing docs) — `functions/index.js`'s
  `createRoom`/`createMessageEndpoint` (`onCall`) do the check-then-write
  inside a Firestore transaction: reject if the handle doc already
  exists, reject if the caller already owns 3. Client-side:
  `createRoomHandle`/`createEndpointHandle` in `messages.js`/`inbox.js`
  call these via `httpsCallable` (needs `getFunctions(firebaseApp)`,
  exported from `firebase.js`). Direct client `create` is rules-denied
  (`allow create: if false`) — it only goes through the function.
  `deleteRoom`/`deleteMessageEndpoint` (also `onCall`) verify ownership,
  delete subcollections + the Storage banner, then the doc — client
  `delete` is also rules-denied for the same reason.
- **UI**: `HomeScreen` now lists rooms and endpoints (`LinkCard.jsx`,
  shared between both) under two `.home-section`s, each with a
  "+ Create new…" action (hidden once at 3) opening `CreateLinkModal.jsx`
  (handle + optional banner file + a theme-color swatch picker,
  `theme-presets.js`). Each `LinkCard` has copy-link/enter/open-close(
  rooms only)/settings(theme+banner, inline expansion)/delete actions.
  `InboxScreen` (Chats) is now read-only management of *received*
  messages — lists your endpoints, each with its messages and
  "Copy as image"; creating/deleting/theming endpoints happens on Home,
  not here. **Profile lost its display-name field and message-link
  card** — both were meaningless once links became per-handle rather
  than per-account (each link's `handle` now plays that role); `users.js`
  and the `users/{userId}` rule were deleted as dead code.
- **Per-link theming**: `ChatRoomScreen`/`AnonymousMessageScreen` apply
  `style={{'--primary': themeColor}}` when set. This only reaches
  `--accent`-based CSS (which is literally `var(--primary)`) — tinted
  backgrounds (`--accent-bg`/`--accent-border`) were hardcoded `rgba(255,
  61, 124, ...)` (baked to the *default* primary) and wouldn't have
  picked up an override. Fixed by switching those two to `color-mix(in
  srgb, var(--primary) N%, transparent)` in `index.css` — now the whole
  cascade actually responds to a per-room/per-link color.
- **Optimistic send + a real race, fixed**: a message/image now appears
  in the sender's own bubble immediately at reduced opacity
  (`.bubble-row--pending`, `MessageBubble`'s `pending` prop) — added in
  `ChatRoomScreen.handleSend` as a client-only placeholder *before*
  awaiting `sendMessage` (which uploads any image, then writes). Caught
  during testing: Firestore's own local-cache echo (the SDK's normal
  "optimistic" behavior, unrelated to this feature) can add the real
  message to `messages` within ~100ms regardless of network latency —
  often *before* the placeholder's own promise chain finishes, since that
  chain also waits on image upload. Waiting for that chain to remove the
  placeholder caused a visible duplicate. Fixed by reconciling inside the
  `subscribeToLatestMessages` callback itself: whenever real messages
  update, drop any pending entry a same-sender-same-text real message
  already covers, rather than waiting for the send call to finish.
- **Dynamic link-preview meta tags** (`functions/index.js`'s
  `linkPreview`, an `onRequest` HTTP function): Hosting rewrites `/r/**`
  and `/m/**` to it (`firebase.json`) so a shared link shows the right
  banner/title when pasted into WhatsApp/etc. — crawlers read meta tags
  from the initial HTML, before any JS runs, so a static SPA can't do
  this on its own. **Two real bugs found and fixed while verifying this
  end-to-end, not just by reasoning about it:**
  1. First version unconditionally fetched
     `https://anix.web.app/index.html` over the network on *every*
     request (bots and real visitors alike, to dodge maintaining a
     bot-detection list) — this added 1.5-5s of latency to *every*
     room/message-link visit and sometimes failed outright
     (`ERR_SOCKET_NOT_CONNECTED`). Fixed by bundling the template
     locally instead: `npm run build` now also copies `dist/index.html`
     to `functions/index-template.html` (see the `build` script in
     `package.json`), which the function reads once at cold start
     (`fs.readFileSync`, no network call). It only does the Firestore
     lookup + meta-tag injection for a request whose User-Agent matches
     a real crawler-pattern regex; everything else gets the bundled
     template immediately, unmodified.
  2. Even after that fix, a **stale cached response** made the deployed
     site intermittently show wrong behavior (e.g. `/m/:endpointId`
     falling back to a generic heading) that didn't reproduce locally.
     Root cause: the pre-fix version set `Cache-Control: public,
     max-age=300` on *every* response including regular visitors' (not
     just crawlers'), and some layer held onto that. Fixed by explicitly
     setting `Cache-Control: no-store` on the non-crawler fast path.
  3. **Operational trap this creates**: the function's template is a
     *file bundled at function-deploy time*, not read live from Hosting.
     Deploying `hosting` alone (new JS/CSS hashes) without also
     redeploying `functions` leaves `linkPreview` serving old
     script/style tag references that may no longer exist in the new
     Hosting release. Hit this directly once already. **Always deploy
     `functions,hosting` together** (or explicitly redeploy `linkPreview`
     right after any hosting-only deploy) — don't split them.
- Verified end-to-end against **production** with fresh Playwright runs
  after each fix: sign-up → create a room via the modal (handle + Pink
  theme) → confirmed **closed by default** → opened it → entered →
  handle shown as the room title (not a raw id) → back button → created
  an endpoint → a separate signed-out context sent a message to it →
  appeared on Chats → "Copy as image" → clipboard toast. Created 3 rooms
  total and confirmed "+ Create new room" disappears at the cap. Checked
  `curl`'d `/r/:id` and `/m/:id` responses directly for correct
  `og:title`/`og:image` (falling back to `/icon.jpg` with no banner set).
  Confirmed the optimistic-send fix with an artificially throttled
  network (800ms latency via CDP) — single bubble, no duplicate, in both
  the immediate-pending and post-confirm states.

## Code-based ids, not handle-based (2026-09-19, same day, right after the rebuild above)

The rebuild above made the handle *itself* the Firestore doc id/URL id,
which meant handles had to be globally unique — asked whether a random
code could come first instead specifically to avoid that. It's a
strictly better design, adopted immediately:

- **The doc id is now a random 6-character code** (`generateCode()` in
  `functions/index.js`, alphabet excludes `0/o/1/i/l` — unambiguous in a
  URL), not the handle. `createHandleDoc` generates one, retries up to 5
  times on collision (vanishingly unlikely at `31^6` ≈ 887M, but not
  assumed away), *then* does the same ownership/3-cap transaction as
  before. Returns `{ id: code, handle }`.
- **The handle is now purely cosmetic** — no uniqueness constraint at
  all, global or per-user. It's stored as-is on the doc (for display:
  card titles, chat-room header, the message-recipient heading) and,
  optionally, appended to the URL for readability.
- **URLs**: `/r/:code/:handle?` and `/m/:code/:handle?` (`App.jsx`,
  React Router's optional-segment syntax) — `/r/uu23g/movie-night` and
  the bare `/r/uu23g` both resolve to the same room; only `:code` is
  ever read by the app (`ChatRoomScreen`/`AnonymousMessageScreen`'s
  `useParams()` — unchanged, since they only destructured the code
  param already). The `:handle` segment is decorative only and not
  validated against the doc's actual handle. `HomeScreen` builds links
  as `${origin}/r/${room.id}/${room.handle}` (same pattern for `/m/`) —
  the only place in the client that constructs these URLs.
  `linkPreview`'s path regex (`/^\/(r|m)\/([^/]+)/`) needed no change —
  it already only captured the first segment.
- A future benefit this unlocks but doesn't yet use: since the handle no
  longer *is* the identity, it could become editable later (rename a
  room without breaking already-shared links) — not built, just noted
  as available.
- Verified against production: created a room and an endpoint, confirmed
  the copied link is `/m/<code>/<handle>` (code ≠ handle), confirmed the
  bare `/m/<code>` (no handle segment) also resolves correctly on its
  own.

## UX polish pass (2026-09-19, same day)

A large batch of concrete gaps/bugs found by actually using the deployed
app, not by re-reasoning about the code:

- **File inputs restyled**: native `<input type="file">` (inconsistent
  OS-themed "Choose File" button) replaced everywhere with
  `shared/components/FilePicker.jsx` — a visually-hidden real input
  triggered by a styled `<label for>` (works with no JS), showing the
  chosen filename and a clear button. Used by `CreateLinkModal` and
  `LinkCard`'s inline banner picker.
- **Install prompt**: `shared/components/InstallPrompt.jsx` captures
  Chromium's `beforeinstallprompt`, suppresses the default mini-infobar,
  and shows a custom bottom-sheet-style card instead (icon, name, tagline,
  Install/Not now) — clicking Install still has to call the captured
  event's own `.prompt()` (the real OS dialog can't be skipped or
  reimplemented, only the *lead-up* UI can be custom). Dismissing sets a
  1-week localStorage cooldown. **Needed a minimal service worker**
  (`public/sw.js`, registered in `main.jsx`) — installability requires
  one on most browsers; it's a no-op fetch handler only, no caching
  attempted (Anix is realtime/Firestore-driven; blanket caching risks
  stale data). Doesn't fire on iOS Safari (no `beforeinstallprompt`
  there) — the component just silently never appears, rather than
  showing a button that would do nothing.
- **Delete confirmation flow**: `LinkCard`'s delete (×) button no longer
  deletes immediately — opens `ConfirmDialog.jsx` first (extracted
  `.modal-overlay`/`.modal`/`.modal__actions`/`.modal__swatches` into a
  shared `modal.css` so `ConfirmDialog` and `CreateLinkModal` don't
  duplicate that chrome). On confirm, the card dims to 0.5 opacity with a
  centered `Spinner` overlay (`.card--deleting`, `.link-card__deleting-overlay`)
  while the delete Cloud Function runs (~2-2.5s observed, not
  instant — cold-start-ish, matches `linkPreview`'s latency profile), then
  a success/error toast. On success the card unmounts naturally once the
  owner's list updates (no local "removed" state needed); on failure the
  card recovers to normal so the user can retry.
- **Loading skeletons, header never gated on them**: `CardSkeleton.jsx`
  (mirrors `Card`'s badge+title/subtitle shape) shows while
  `rooms`/`endpoints`/inbox `messages` are `null` (the loading sentinel —
  changed from an initial `[]`, which couldn't be told apart from "really
  zero rooms"). Home's `<Page>` header (brand mark + "Anix") was already
  structurally outside this loading gate and always rendered instantly —
  the actual complaint was the *content area* looking blank/broken with
  no visual cue anything was loading, not the header itself being
  delayed.
- **Pending-state spinners made systematic**: `Button.jsx` gained a
  `loading` prop (shows a `Spinner`, forces `disabled`) instead of each
  screen hand-rolling its own text-swap — several places had *no*
  pending feedback at all before this (auth submit/Google, the feedback
  form, log out). Applied to: `AuthScreen` (separate `pendingAction`
  state so the spinner lands on whichever of the two buttons was
  actually clicked, not both), `CreateLinkModal`'s Create button,
  `ProfileScreen`'s log-out and feedback-submit, `LinkCard`'s
  open/close-room toggle and theme-swatch selection (both previously
  silent — a click just... did nothing visible until Firestore's
  snapshot updated the card), `InboxScreen`'s "Copy as image" (per-
  message `sharingId` state, so only the clicked message's button shows
  the spinner).
- **`AnonymousMessageScreen` rebuilt**: was bare-minimum (a plain
  centered form, no banner shown at all despite the endpoint having
  one, and no way to send a second message without a manual reload). Now
  has a real header (`anon-message__banner` — the endpoint's banner
  image if set, object-fit cover; otherwise a themed radial-gradient
  placeholder with the real app icon centered, so it never looks broken),
  more generous spacing throughout, and the "sent" state offers
  **Send another message** (resets `sent`/`text` locally — the endpoint
  data is already in state, no refetch needed).
- **`message-image.js` (the generated share-image) fixed to match
  reality**: was still drawing the pre-2026-09-19 placeholder "A" badge
  (from before the real ghost-icon.jpg was adopted) and never accepted
  or drew the endpoint's `bannerImageUrl`/`themeColor` at all — every
  generated image looked identical regardless of the endpoint. Now
  loads `/icon.jpg` via `drawImage`, draws the endpoint's banner as a
  cropped header band (`drawImageCover`, a canvas `object-fit:cover`
  equivalent) with a gradient fade into the message card below, and uses
  `themeColor` for the wordmark/card-border accent. **Defensive**: a
  cross-origin banner without permissive CORS taints the canvas —
  `canvas.toBlob()` throws `SecurityError` — caught and retried once
  without the banner rather than failing image generation entirely.
  `InboxScreen` updated to pass `endpoint.bannerImageUrl`/`themeColor`
  through (it previously called `generateMessageImageBlob(text)` with no
  second argument at all).
- **Theme color now actually cascades everywhere a room/endpoint is
  themed, not just buttons**: `themeStyleVars()` (new,
  `shared/utils/theme-vars.js`) derives `--bg`/`--panel`/`--panel-alt`/
  `--border` from the theme color via `color-mix()` against the same
  near-black base every dark surface uses — previously only `--primary`
  (hence only `--accent`-based elements: buttons, the own-message
  bubble) was overridden, so hover backgrounds, the page backdrop,
  bubble-other/reply-strip surfaces, and borders all silently stayed on
  the fixed default palette regardless of theme. `ChatRoomScreen`/
  `AnonymousMessageScreen` now call this instead of setting `--primary`
  directly. Two remaining hardcoded `rgba(128, 128, 128, 0.12)` chips
  (`MessageBubble.css`'s reply-strip, `Composer.css`'s reply/image
  preview) — never using a token at all — switched to `var(--panel-alt)`
  so they respond too. **Real structural bug found while verifying
  this**: `.chat-room`/`.anon-message` never declared their own
  `background`/`color` — they were just visually inheriting the page's
  actual painted background from `:root` (an *ancestor*), so overriding
  `--bg` on a *descendant* element had no visible surface to land on at
  all. Fixed by adding explicit `background: var(--bg); color:
  var(--text);` to both. Verified live: a themed room's computed
  background is a genuine `color-mix()` result, not the default
  `rgb(18, 10, 22)`.
- Verified end-to-end against production after each fix (fresh Playwright
  runs, zero console errors throughout): delete confirm → dim+spinner →
  toast → card gone (~2.4s); a Green-themed room's background/borders/
  composer/send-button all shifted together, not just the button.
- **Follow-up same day**: `--primary-dark`/`--primary-light` weren't part
  of `themeStyleVars()`'s override — `Button`'s hover/active states read
  `--primary-dark` specifically (`Button.css`), so a themed room's send
  button still hovered to the *fixed default* violet-dark regardless of
  what color the room actually used. Added both (via `color-mix()`
  toward black/white — an approximation, not the precise HSL ramp the
  base palette uses, but fine for an arbitrary preset). Also gave
  `.bubble` its first-ever hover/focus-visible state (`MessageBubble.css`
  — there wasn't one at all before): `filter: brightness(1.1)` on hover
  (stays correct against whatever the themed background resolves to, no
  extra token needed) and an `--accent`-colored `:focus-visible` outline
  instead of leaving it to the browser default. **Auth page branding**:
  `AuthScreen` had no logo/name at all — added a small fixed top-left
  `icon.jpg` + "Anix" lockup (`.auth-screen__brand`, absolutely
  positioned since `.auth-screen` is a centered-content layout, not
  `Page`'s header+content structure). Verified live: a Blue-themed room's
  send button hovers to a genuinely darker blue (not the old violet).

## UX polish pass #2 (2026-09-19)

- **Report button in chat room was dead**: `ChatRoomScreen` had no
  `onReport` handler wired at all — the button rendered but did nothing.
  Added `handleReport(message)` calling the existing (already-deployed)
  `reportMessage` Firestore write, with a success toast ("Reported —
  thanks for flagging it") and an error toast on failure, wired as
  `onReport` on `MessageBubble`.
- **Copying an image-only bubble silently copied nothing**:
  `MessageBubble`'s `handleCopy` called `navigator.clipboard.writeText`
  unconditionally even when `message.text` was empty. Added an early
  guard: empty text now shows a "No text to copy" error toast instead of
  a silent no-op; non-empty text still copies and shows "Copied".
- **Banner upload showed "No file chosen" even with a banner already
  set**: `FilePicker` only ever displayed the transient in-memory `file`
  state, which `LinkCard.handleBannerChange` resets to `null` in its
  `finally` block right after upload — so the label reverted the instant
  the upload finished, even though `item.bannerImageUrl` was genuinely
  set. Added an `existingLabel` prop to `FilePicker` ("Banner set ✓"),
  passed from `LinkCard` whenever `item.bannerImageUrl` is truthy, shown
  whenever no file is actively selected. Verified live: label reads
  "Banner set ✓" immediately after upload and still does after closing
  and reopening the settings panel (not just an upload-in-progress
  artifact).
- **Time-of-day greetings** (new `shared/utils/greetings.js`):
  `getTimeGreeting()` (5 hour-based buckets — night/morning/afternoon/
  evening/night again — 2 phrasing options each, randomly picked once
  per mount), `getProfilePrompt()` (3 feedback/theme-oriented options),
  `getChatsPrompt(hasMessages)` (3 options each for the has-messages vs.
  empty-inbox case). Rendered as a shared `.page-greeting` line
  (`index.css`) right under each page's header: `HomeScreen` (always,
  once rooms/endpoints load), `ProfileScreen` (always), `InboxScreen`
  (only once endpoints have loaded, and its `hasMessages` flag is real —
  required lifting per-endpoint message counts up from `EndpointInbox`
  via a new `onMessageCount` callback prop into a parent `messageCounts`
  map, not guessed from endpoint count alone).
- **Bottom nav could scroll away**: `.nav-bar--bottom` was a normal flex
  child, not fixed — on a long room/endpoint list it would scroll off
  with the content. Changed to `position: fixed; left/right: 0; bottom:
  0; z-index: 40`, with `.app-shell--bottom .page__content` gaining a
  compensating `padding-bottom: calc(60px + env(safe-area-inset-bottom))`
  so fixed content no longer overlaps the last card. Verified live at
  390×700 with 1 room seeded: nav's computed `position` is `fixed`.
- **Profile footer**: added `"powered by IARdays x creativeXPR"` at the
  bottom of `ProfileScreen`, above the nav, `opacity: 0.6`
  (`.profile-screen__footer`).
- **Root domain had no real banner**: `index.html`'s `og:image` pointed
  at the square `/icon.jpg` (poor fit for a 1200×630 link-preview slot —
  gets cropped/shrunk oddly on most platforms). Generated a proper
  1200×630 `public/banner.png` (dark bg, subtle radial glow toward the
  theme pink, the real icon at a clean 736→320px downscale, "Anix"
  wordmark + tagline, Poppins) via a one-off Playwright canvas-render
  script, not a design tool. `index.html` now points `og:image`/
  `twitter:image` at `/banner.png` with explicit `og:image:width`/
  `height` (1200/630) and `twitter:card` upgraded from `summary` to
  `summary_large_image`. `functions/index.js`'s `DEFAULT_BANNER` fallback
  (used by `linkPreview` for any room/endpoint without its own custom
  banner) updated to match, for consistency across every link-preview
  surface.
- Verified end-to-end against production after deploy (fresh Playwright
  runs, zero console errors): report click → toast; image-only bubble
  copy → "No text to copy" toast; banner upload → "Banner set ✓" label
  survives settings-panel close/reopen; Home/Profile/Chats each show
  their greeting; bottom nav computed `position: fixed`; profile footer
  present at `opacity: 0.6`; `curl` on `/` confirms `og:image` is
  `/banner.png` (200, ~515KB) and `twitter:card` is
  `summary_large_image`.
