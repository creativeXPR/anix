import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import Button from '../../shared/components/Button.jsx'
import CardSkeleton from '../../shared/components/CardSkeleton.jsx'
import CreateLinkModal from '../../shared/components/CreateLinkModal.jsx'
import LinkCard from '../../shared/components/LinkCard.jsx'
import Page from '../../shared/components/Page.jsx'
import NotificationPrompt from './NotificationPrompt.jsx'
import { useAuthUser } from '../../shared/auth-store.js'
import { uploadBanner } from '../../shared/upload-banner.js'
import { getTimeGreeting } from '../../shared/utils/greetings.js'
import HomeIcon from '../../shared/icons/HomeIcon.jsx'
import MessageIcon from '../../shared/icons/MessageIcon.jsx'

const MAX_PER_TYPE = 3

export default function HomeScreen() {
  const { user } = useAuthUser()
  const navigate = useNavigate()
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

  async function handleCreateRoom({ handle, themeColor, bannerFile }) {
    const roomId = await createRoomHandle(handle, themeColor)
    if (bannerFile) {
      const bannerImageUrl = await uploadBanner('room', roomId, bannerFile)
      await updateRoomSettings(roomId, { bannerImageUrl })
    }
    setCreating(null)
  }

  async function handleCreateEndpoint({ handle, themeColor, bannerFile }) {
    const endpointId = await createEndpointHandle(handle, themeColor)
    if (bannerFile) {
      const bannerImageUrl = await uploadBanner('endpoint', endpointId, bannerFile)
      await updateEndpointSettings(endpointId, { bannerImageUrl })
    }
    setCreating(null)
  }

  return (
    <Page title="Anix" brand>
      <p className="page-greeting">
        {greeting.text} {greeting.emoji}
      </p>

      <section className="home-section">
        <h3>Your rooms</h3>
        {rooms === null ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {rooms.map((room) => (
              <LinkCard
                key={room.id}
                item={room}
                kind="room"
                icon={HomeIcon}
                link={`${window.location.origin}/r/${room.id}/${room.handle}`}
                activeCount={activeCounts[room.id] ?? 0}
                onEnter={() => navigate(`/r/${room.id}/${room.handle}`)}
                onToggleStatus={() =>
                  setRoomStatus(room.id, room.status === 'open' ? 'closed' : 'open')
                }
                onDelete={() => deleteRoomHandle(room.id)}
                onUpdateSettings={(updates) => updateRoomSettings(room.id, updates)}
              />
            ))}
            {rooms.length < MAX_PER_TYPE && (
              <Button variant="secondary" onClick={() => setCreating('room')}>
                + Create new room
              </Button>
            )}
          </>
        )}
      </section>

      <section className="home-section">
        <h3>Anonymous messages</h3>
        {endpoints === null ? (
          <CardSkeleton />
        ) : (
          <>
            {endpoints.map((endpoint) => (
              <LinkCard
                key={endpoint.id}
                item={endpoint}
                kind="endpoint"
                icon={MessageIcon}
                link={`${window.location.origin}/m/${endpoint.id}/${endpoint.handle}`}
                onDelete={() => deleteEndpointHandle(endpoint.id)}
                onUpdateSettings={(updates) => updateEndpointSettings(endpoint.id, updates)}
              />
            ))}
            {endpoints.length < MAX_PER_TYPE && (
              <Button variant="secondary" onClick={() => setCreating('endpoint')}>
                + Create new link
              </Button>
            )}
          </>
        )}
      </section>

      {creating === 'room' && (
        <CreateLinkModal
          title="Create a room"
          onCreate={handleCreateRoom}
          onClose={() => setCreating(null)}
        />
      )}
      {creating === 'endpoint' && (
        <CreateLinkModal
          title="Create an anonymous-message link"
          onCreate={handleCreateEndpoint}
          onClose={() => setCreating(null)}
        />
      )}

      <NotificationPrompt />
    </Page>
  )
}
