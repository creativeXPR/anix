import { useEffect, useState } from 'react'
import {
  createRoomHandle,
  deleteRoomHandle,
  subscribeToOwnedRooms,
  subscribeToPresenceCount,
  setRoomStatus,
  updateRoomSettings,
} from '../chatroom/messages.js'
import {
  createEndpointHandle,
  deleteEndpointHandle,
  subscribeToOwnedEndpoints,
  updateEndpointSettings,
} from '../inbox/inbox.js'
import CardSkeleton from '../../shared/components/CardSkeleton.jsx'
import CreateLinkModal from '../../shared/components/CreateLinkModal.jsx'
import FunEmpty from '../../shared/components/FunEmpty.jsx'
import LinkCard from '../../shared/components/LinkCard.jsx'
import Page from '../../shared/components/Page.jsx'
import NotificationPrompt from './NotificationPrompt.jsx'
import { useAuthUser } from '../../shared/auth-store.js'
import { useUnreadCounts } from '../inbox/use-unread-counts.js'
import { uploadBanner } from '../../shared/upload-banner.js'
import { getTimeGreeting } from '../../shared/utils/greetings.js'
import './HomeScreen.css'

const MAX_PER_TYPE = 3

export default function HomeScreen() {
  const { user } = useAuthUser()
  // Locked in once per mount (not re-rolled on every render) via the
  // lazy useState initializer.
  const [greeting] = useState(getTimeGreeting)

  // null = still loading (distinct from a real empty list) — the header
  // above renders immediately either way, since it doesn't depend on
  // this fetch at all.
  const [rooms, setRooms] = useState(null)
  const [endpoints, setEndpoints] = useState(null)
  const [activeCounts, setActiveCounts] = useState({})
  const [creating, setCreating] = useState(null) // 'room' | 'endpoint' | null
  const unread = useUnreadCounts(user.uid)

  useEffect(() => subscribeToOwnedRooms(user.uid, setRooms), [user.uid])
  useEffect(() => subscribeToOwnedEndpoints(user.uid, setEndpoints), [user.uid])

  useEffect(() => {
    const unsubscribes = (rooms || []).map((room) =>
      subscribeToPresenceCount(room.id, (count) =>
        setActiveCounts((current) => ({ ...current, [room.id]: count })),
      ),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [rooms])

  // The create functions only take handle + themeColor; everything else
  // (photo, emoji, game/prompt) is an owner settings update right after —
  // same path the settings sheet uses, so no Cloud Function change.
  async function handleCreateRoom({ handle, themeColor, bannerFile, open, emoji }) {
    const roomId = await createRoomHandle(handle, themeColor)
    const settings = { emoji }
    if (bannerFile) settings.bannerImageUrl = await uploadBanner('room', roomId, bannerFile)
    await updateRoomSettings(roomId, settings)
    // createRoom always makes rooms closed; "open the room now" flips it.
    if (open) await setRoomStatus(roomId, 'open')
    setCreating(null)
  }

  async function handleCreateEndpoint({ handle, themeColor, bannerFile, game, prompt }) {
    const endpointId = await createEndpointHandle(handle, themeColor)
    const settings = { game, prompt }
    if (bannerFile) settings.bannerImageUrl = await uploadBanner('endpoint', endpointId, bannerFile)
    await updateEndpointSettings(endpointId, settings)
    setCreating(null)
  }

  return (
    <Page title="anix" brand>
      <div className="home-hello">
        <h1>
          {greeting.text.toLowerCase()} {greeting.emoji}
        </h1>
        <p>who's spilling tea today?</p>
      </div>

      <section>
        <div className="home-head">
          <h2>your links</h2>
          {endpoints !== null && <small>{endpoints.length}/{MAX_PER_TYPE}</small>}
        </div>
        {endpoints === null ? (
          <CardSkeleton />
        ) : endpoints.length === 0 ? (
          <FunEmpty
            emoji="💌"
            title="no links yet"
            text="make one, drop it in your story and see what people really think 👀"
            cta="+ Create a link"
            onClick={() => setCreating('endpoint')}
          />
        ) : (
          <div className="home-grid">
            {endpoints.map((endpoint) => (
              <LinkCard
                key={endpoint.id}
                item={endpoint}
                kind="endpoint"
                link={`${window.location.origin}/m/${endpoint.id}/${endpoint.handle}`}
                unreadCount={unread.byEndpoint[endpoint.id]}
                onDelete={() => deleteEndpointHandle(endpoint.id)}
                onUpdateSettings={(updates) => updateEndpointSettings(endpoint.id, updates)}
              />
            ))}
            {endpoints.length < MAX_PER_TYPE && (
              <button type="button" className="home-new-tile" onClick={() => setCreating('endpoint')}>
                <span className="home-new-tile__plus">+</span>
                new link
              </button>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="home-head">
          <h2>your rooms</h2>
          {rooms !== null && <small>{rooms.length}/{MAX_PER_TYPE}</small>}
        </div>
        {rooms === null ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : rooms.length === 0 ? (
          <FunEmpty
            emoji="🫧"
            title="no rooms yet"
            text="start one, drop the link in your story and let the chaos begin 👀"
            cta="+ Start a room"
            onClick={() => setCreating('room')}
          />
        ) : (
          <div className="home-list">
            {rooms.map((room) => (
              <LinkCard
                key={room.id}
                item={room}
                kind="room"
                link={`${window.location.origin}/r/${room.id}/${room.handle}`}
                enterTo={`/r/${room.id}/${room.handle}`}
                activeCount={activeCounts[room.id] ?? 0}
                onToggleStatus={() => setRoomStatus(room.id, room.status === 'open' ? 'closed' : 'open')}
                onDelete={() => deleteRoomHandle(room.id)}
                onUpdateSettings={(updates) => updateRoomSettings(room.id, updates)}
              />
            ))}
            {rooms.length < MAX_PER_TYPE && (
              <button
                type="button"
                className="home-new-tile home-new-tile--row"
                onClick={() => setCreating('room')}
              >
                <span className="home-new-tile__plus">+</span>
                new room
              </button>
            )}
          </div>
        )}
      </section>

      {creating && (
        <CreateLinkModal
          kind={creating}
          onCreate={creating === 'room' ? handleCreateRoom : handleCreateEndpoint}
          onClose={() => setCreating(null)}
        />
      )}

      <NotificationPrompt />
    </Page>
  )
}

