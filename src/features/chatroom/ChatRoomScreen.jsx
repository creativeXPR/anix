import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthUser } from '../../shared/auth-store.js'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import FunEmpty from '../../shared/components/FunEmpty.jsx'
import ItemSettingsSheet from '../../shared/components/ItemSettingsSheet.jsx'
import { useAnonymousParticipant } from '../../shared/hooks/use-anonymous-participant.js'
import { useOwnsDoc } from '../../shared/owned-docs.js'
import { usePopOnNew } from '../../shared/hooks/use-pop-on-new.js'
import BackIcon from '../../shared/icons/BackIcon.jsx'
import SettingsIcon from '../../shared/icons/SettingsIcon.jsx'
import { DEFAULT_ROOM_EMOJI } from '../../shared/room-defaults.js'
import { useToast } from '../../shared/toast-store.js'
import { messageGradient, messageGradientVars } from '../../shared/utils/message-gradient.js'
import { getLastVisit, markVisited } from '../../shared/utils/room-visits.js'
import Composer from './components/Composer.jsx'
import MessageBubble from './components/MessageBubble.jsx'
import { ChatSkeleton } from '../../shared/components/Skeletons.jsx'
import TypingIndicator from './components/TypingIndicator.jsx'
import { useRoomBadge } from '../football/football-data.js'
import { kitFor } from '../rooms/kits.js'
import { IdentityPicker, IdentitySheet } from '../football/IdentityPicker.jsx'
import MatchCard from '../football/MatchCard.jsx'
import MatchPicker from '../football/MatchPicker.jsx'
import PollCard from '../football/PollCard.jsx'
import PollComposer from '../football/PollComposer.jsx'
import { useMyStickers } from '../stickers/my-stickers.js'
import StickerTray from '../stickers/StickerTray.jsx'
import {
  canSendNow,
  deleteRoomHandle,
  loadOlderMessages,
  reportMessage,
  sendMessage,
  setRoomStatus,
  setTyping,
  startPresenceHeartbeat,
  subscribeToLatestMessages,
  subscribeToPresenceCount,
  subscribeToRoom,
  subscribeToTypingCount,
  updateRoomSettings,
} from './messages.js'
import './ChatRoomScreen.css'

const NEAR_BOTTOM_THRESHOLD_PX = 120
const NEAR_TOP_THRESHOLD_PX = 80
const HIGHLIGHT_DURATION_MS = 1500

export default function ChatRoomScreen() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const participantId = useAnonymousParticipant(roomId)
  const { user } = useAuthUser()

  const [messages, setMessages] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [typingCount, setTypingCount] = useState(0)
  const [highlightedId, setHighlightedId] = useState(null)
  const [room, setRoom] = useState(null)
  const [pendingMessages, setPendingMessages] = useState([])
  const [presenceCount, setPresenceCount] = useState(0)
  // Pop for other people's new messages — not yours, and not older ones
  // that load in when scrolling up (only messages sent after you opened
  // the room count). A brand-new message's createdAt is briefly null.
  const [openedAt] = useState(() => Date.now())
  const fromSomeoneElse = useCallback(
    (message) => message.senderId !== participantId && (message.createdAt?.toMillis?.() ?? Date.now()) > openedAt,
    [participantId, openedAt],
  )
  usePopOnNew(messages, { ready: !initialLoading, isIncoming: fromSomeoneElse })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [badge, setBadge] = useRoomBadge(roomId)
  const myStickers = useMyStickers()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const scrollRef = useRef(null)
  // Captured once, before this visit updates it — used to place the
  // "new messages" divider. State (not a ref) because it's read during
  // render, and a ref's .current can't safely be read there.
  const [initialLastVisit] = useState(() => getLastVisit(roomId))

  useEffect(() => {
    const unsubscribe = subscribeToLatestMessages(roomId, (nextMessages) => {
      const container = scrollRef.current
      const wasNearBottom =
        !container ||
        container.scrollHeight - container.scrollTop - container.clientHeight <
          NEAR_BOTTOM_THRESHOLD_PX

      setMessages(nextMessages)
      setInitialLoading(false)

      // Firestore's own local-cache echo (see messages.js) can add the
      // real message to `nextMessages` almost instantly regardless of
      // network latency — often before the pending placeholder's own
      // promise chain (which also waits on image upload) resolves.
      // Reconcile here instead of waiting for that chain, so the two
      // never visibly coexist: drop any pending entry a just-arrived
      // real message from ourself already covers (matched by sender +
      // text, since the placeholder has no server id to match on).
      setPendingMessages((current) =>
        current.filter(
          (pendingMessage) =>
            !nextMessages.some(
              (real) =>
                real.senderId === pendingMessage.senderId &&
                real.text === pendingMessage.text &&
                JSON.stringify(real.sticker || null) === JSON.stringify(pendingMessage.sticker || null),
            ),
        ),
      )

      if (wasNearBottom) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      }
    })
    return unsubscribe
  }, [roomId])

  useEffect(() => {
    return subscribeToTypingCount(roomId, participantId, setTypingCount)
  }, [roomId, participantId])

  useEffect(() => {
    return subscribeToRoom(roomId, setRoom)
  }, [roomId])

  useEffect(() => {
    if (!participantId) return undefined // guest id still being set up
    return startPresenceHeartbeat(roomId, participantId)
  }, [roomId, participantId])

  useEffect(() => subscribeToPresenceCount(roomId, setPresenceCount), [roomId])

  useEffect(() => {
    markVisited(roomId)
  }, [roomId])

  // Always scroll to a just-sent pending message, regardless of current
  // scroll position — unlike incoming messages (which only auto-scroll
  // when already near the bottom), you should always see your own send.
  useEffect(() => {
    if (pendingMessages.length === 0) return
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [pendingMessages])

  async function handleLoadOlder() {
    if (loadingOlder || !hasMoreOlder || messages.length === 0) return
    setLoadingOlder(true)

    const container = scrollRef.current
    const previousScrollHeight = container?.scrollHeight ?? 0

    const { messages: older, hasMore } = await loadOlderMessages(roomId, messages[0])
    setHasMoreOlder(hasMore)
    setMessages((current) => [...older, ...current])

    // Compensate scrollTop so prepending older messages doesn't visually
    // jump the view — the read-then-write has to happen after the DOM
    // reflects the new, taller content.
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - previousScrollHeight
      }
    })
    setLoadingOlder(false)
  }

  function handleScroll(event) {
    if (event.target.scrollTop < NEAR_TOP_THRESHOLD_PX) {
      handleLoadOlder()
    }
  }

  function handleJumpToReply(messageId) {
    document.getElementById(`message-${messageId}`)?.scrollIntoView({ block: 'center' })
    setHighlightedId(messageId)
    setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS)
  }

  // The write itself always worked (rules allow it) — the button just
  // gave zero feedback either way, which reads as "doesn't do anything."
  async function handleReport(message) {
    try {
      if (!participantId) return
      await reportMessage(roomId, message, participantId)
      showToast('Reported — thanks for flagging it', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const isClosed = room?.status === 'closed'
  // The owner (signed in, viewing their own room) gets the settings gear —
  // same sheet as Home's room card.
  // ownerHash check (owner privacy) — nothing public names the owner
  const isOwner = useOwnsDoc(user?.uid, roomId, room) === true
  // Football rooms: everyone gets the gear — for the owner it opens room
  // settings (with their own fan identity folded inside), for everyone
  // else just their fan identity. Nothing visible to others differs.
  const kit = kitFor(room?.type)
  // rooms with a kit (football, anime, weird stories) get identity badges + polls
  const hasKit = Boolean(kit.badges)

  async function handleDeleteRoom() {
    setConfirmingDelete(false)
    try {
      await deleteRoomHandle(roomId)
      showToast('Room deleted', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSaveSticker(sticker) {
    try {
      const added = await myStickers.add(sticker)
      showToast(added ? 'Added to your stickers ⭐' : 'Already in your stickers', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleSend({ text, imageFile, sticker }) {
    if ((!text && !imageFile && !sticker) || isClosed || !canSendNow()) return
    if (!participantId) {
      showToast('Connecting… try again in a second', 'error')
      return
    }

    const activeReplyTo = replyTo
    setReplyTo(null)

    // Shows instantly on the sender's own screen at reduced opacity —
    // otherwise there'd be a visible gap while an image compresses/
    // uploads (that happens before the Firestore write even starts),
    // on top of the write's own round-trip.
    const tempId = `pending-${Date.now()}`
    const localImageUrl = imageFile ? URL.createObjectURL(imageFile) : null
    setPendingMessages((current) => [
      ...current,
      {
        id: tempId,
        text: (text || '').trim(),
        imageUrl: localImageUrl,
        sticker: sticker || null,
        senderId: participantId,
        badge: hasKit ? badge : null,
        replyTo: activeReplyTo
          ? { id: activeReplyTo.id, text: activeReplyTo.text, senderId: activeReplyTo.senderId }
          : null,
        createdAt: { toMillis: () => Date.now() },
        pending: true,
        // images report real upload progress; text sends don't (null →
        // the ring eases toward full while waiting)
        progress: imageFile ? 0 : null,
      },
    ])

    try {
      await sendMessage({
        roomId,
        senderId: participantId,
        text: text || '',
        replyTo: activeReplyTo,
        imageFile,
        sticker,
        badge: hasKit ? badge : null,
        onProgress: (progress) =>
          setPendingMessages((current) => current.map((m) => (m.id === tempId ? { ...m, progress } : m))),
      })
    } finally {
      setPendingMessages((current) => current.filter((message) => message.id !== tempId))
      if (localImageUrl) URL.revokeObjectURL(localImageUrl)
    }
  }

  function handleTypingChange(isTyping) {
    if (participantId) setTyping(roomId, participantId, isTyping)
  }

  const firstUnreadMessage = messages.find(
    (message) =>
      message.senderId !== participantId &&
      message.createdAt?.toMillis?.() > initialLastVisit,
  )

  const visibleMessages = [...messages, ...pendingMessages]

  // The room's theme drives the header band and own bubbles; the page
  // surfaces stay on the app's light/dark tokens (--primary is overridden
  // so focus rings etc. follow the room color too).
  const roomStyle = { ...messageGradientVars(room?.themeColor), '--primary': messageGradient(room?.themeColor).from }

  return (
    <div className="chat-room" style={roomStyle}>
      <header className="chat-room__header">
        <button type="button" className="chat-room__icon-button" onClick={() => navigate('/')} aria-label="Back to home">
          <BackIcon />
        </button>
        {room?.bannerImageUrl ? (
          <img className="chat-room__badge" src={room.bannerImageUrl} alt="" />
        ) : (
          <span className="chat-room__badge chat-room__badge--emoji" aria-hidden="true">
            {room?.emoji || DEFAULT_ROOM_EMOJI}
          </span>
        )}
        <div className="chat-room__title">
          <h1>{room?.handle || 'chat room'}</h1>
          <small>
            {presenceCount > 0 ? `${presenceCount} ${presenceCount === 1 ? 'person' : 'people'} here` : 'just you'} ·
            anonymous
          </small>
        </div>
        {(isOwner || hasKit) && (
          <button
            type="button"
            className="chat-room__icon-button chat-room__settings"
            onClick={() => (isOwner ? setSettingsOpen(true) : setIdentityOpen(true))}
            aria-label={isOwner ? 'Room settings' : kit.identityTitle}
          >
            <SettingsIcon />
          </button>
        )}
      </header>

      {kit.matchCard && room?.pinnedMatch && <MatchCard matchId={room.pinnedMatch} roomId={roomId} room={room} />}

      <div className="chat-room__messages" ref={scrollRef} onScroll={handleScroll}>
        {initialLoading ? (
          <ChatSkeleton variant="room" />
        ) : visibleMessages.length === 0 ? (
          <FunEmpty emoji="👋" title="say hi!" text="nobody's said anything yet — be the first. you're anonymous here." />
        ) : (
          visibleMessages.map((message, index) => (
            <div key={message.id}>
              {firstUnreadMessage?.id === message.id && (
                <div className="chat-room__unread-divider">
                  <span>new messages</span>
                </div>
              )}
              {message.type === 'event' ? (
                <div className="room-event" id={`message-${message.id}`}>
                  <span>{message.text}</span>
                </div>
              ) : message.type === 'poll' ? (
                <PollCard roomId={roomId} room={room} message={message} participantId={participantId} disabled={isClosed || !participantId} />
              ) : (
              <MessageBubble
                message={message}
                isOwn={message.senderId === participantId}
                showHeader={
                  index === 0 ||
                  visibleMessages[index - 1].senderId !== message.senderId ||
                  visibleMessages[index - 1].badge?.id !== message.badge?.id
                }
                isHighlighted={highlightedId === message.id}
                onReply={setReplyTo}
                onReport={handleReport}
                onJumpToReply={handleJumpToReply}
                onSaveSticker={handleSaveSticker}
              />
              )}
            </div>
          ))
        )}
        <TypingIndicator count={typingCount} />
      </div>

      {isClosed && <div className="chat-room__closed-banner">🔒 this room is closed</div>}

      <Composer
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        disabled={isClosed}
        onPoll={hasKit ? () => setPollOpen(true) : undefined}
        stickers={room ? <StickerTray room={room} onSend={(sticker) => handleSend({ sticker })} /> : null}
      />

      {settingsOpen && room && (
        <ItemSettingsSheet
          item={{ ...room, id: roomId }}
          kind="room"
          onUpdateSettings={(updates) => updateRoomSettings(roomId, updates)}
          onToggleStatus={() => setRoomStatus(roomId, isClosed ? 'open' : 'closed')}
          onDelete={() => setConfirmingDelete(true)}
          onClose={() => setSettingsOpen(false)}
        >
          {kit.matchCard && (
            <details className="settings-collapsible" open={!room.pinnedMatch}>
              <summary>📺 match card {room.pinnedMatch ? '· pinned' : ''}</summary>
              <MatchPicker value={room.pinnedMatch || null} onChange={(pinnedMatch) => updateRoomSettings(roomId, { pinnedMatch })} />
            </details>
          )}
          {hasKit && (
            <details className="settings-collapsible">
              <summary>
                {kit.emoji} {kit.identityTitle}
              </summary>
              <IdentityPicker participantId={participantId} badge={badge} onChange={setBadge} type={room.type} />
            </details>
          )}
        </ItemSettingsSheet>
      )}
      {identityOpen && (
        <IdentitySheet participantId={participantId} badge={badge} onChange={setBadge} type={room?.type} onClose={() => setIdentityOpen(false)} />
      )}
      {pollOpen && <PollComposer roomId={roomId} type={room?.type} onClose={() => setPollOpen(false)} />}
      {confirmingDelete && (
        <ConfirmDialog
          title="delete this room?"
          message={`"${room?.handle}" and every message in it will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete room"
          onConfirm={handleDeleteRoom}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
