import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../../shared/components/EmptyState.jsx'
import { useAnonymousParticipant } from '../../shared/hooks/use-anonymous-participant.js'
import BackIcon from '../../shared/icons/BackIcon.jsx'
import MessageIcon from '../../shared/icons/MessageIcon.jsx'
import { useToast } from '../../shared/toast-store.js'
import { getLastVisit, markVisited } from '../../shared/utils/room-visits.js'
import { themeStyleVars } from '../../shared/utils/theme-vars.js'
import Composer from './components/Composer.jsx'
import MessageBubble from './components/MessageBubble.jsx'
import MessageSkeleton from './components/MessageSkeleton.jsx'
import TypingIndicator from './components/TypingIndicator.jsx'
import {
  canSendNow,
  loadOlderMessages,
  reportMessage,
  sendMessage,
  setTyping,
  startPresenceHeartbeat,
  subscribeToLatestMessages,
  subscribeToRoom,
  subscribeToTypingCount,
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

  const [messages, setMessages] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [typingCount, setTypingCount] = useState(0)
  const [highlightedId, setHighlightedId] = useState(null)
  const [room, setRoom] = useState(null)
  const [pendingMessages, setPendingMessages] = useState([])

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
                real.senderId === pendingMessage.senderId && real.text === pendingMessage.text,
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
    return startPresenceHeartbeat(roomId, participantId)
  }, [roomId, participantId])

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
      await reportMessage(roomId, message.id, participantId)
      showToast('Reported — thanks for flagging it', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const isClosed = room?.status === 'closed'

  async function handleSend({ text, imageFile }) {
    if ((!text && !imageFile) || isClosed || !canSendNow()) return

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
        text: text.trim(),
        imageUrl: localImageUrl,
        senderId: participantId,
        replyTo: activeReplyTo
          ? { id: activeReplyTo.id, text: activeReplyTo.text, senderId: activeReplyTo.senderId }
          : null,
        createdAt: { toMillis: () => Date.now() },
        pending: true,
      },
    ])

    try {
      await sendMessage({ roomId, senderId: participantId, text, replyTo: activeReplyTo, imageFile })
    } finally {
      setPendingMessages((current) => current.filter((message) => message.id !== tempId))
      if (localImageUrl) URL.revokeObjectURL(localImageUrl)
    }
  }

  function handleTypingChange(isTyping) {
    setTyping(roomId, participantId, isTyping)
  }

  const firstUnreadMessage = messages.find(
    (message) =>
      message.senderId !== participantId &&
      message.createdAt?.toMillis?.() > initialLastVisit,
  )

  const visibleMessages = [...messages, ...pendingMessages]

  return (
    <div className="chat-room" style={themeStyleVars(room?.themeColor)}>
      <header className="chat-room__header">
        <button
          type="button"
          className="chat-room__icon-button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <BackIcon />
        </button>
        <h1>{room?.handle || 'Chat room'}</h1>
      </header>

      <div className="chat-room__messages" ref={scrollRef} onScroll={handleScroll}>
        {initialLoading ? (
          <>
            <MessageSkeleton align="left" width={140} />
            <MessageSkeleton align="right" width={180} />
            <MessageSkeleton align="left" width={120} />
          </>
        ) : visibleMessages.length === 0 ? (
          <EmptyState icon={MessageIcon} title="No messages yet" />
        ) : (
          visibleMessages.map((message, index) => (
            <div key={message.id}>
              {firstUnreadMessage?.id === message.id && (
                <div className="chat-room__unread-divider">New messages</div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.senderId === participantId}
                showHeader={
                  index === 0 || visibleMessages[index - 1].senderId !== message.senderId
                }
                isHighlighted={highlightedId === message.id}
                onReply={setReplyTo}
                onReport={handleReport}
                onJumpToReply={handleJumpToReply}
              />
            </div>
          ))
        )}
        <TypingIndicator count={typingCount} />
      </div>

      {isClosed && (
        <div className="chat-room__closed-banner text-b3">This room is closed by its host.</div>
      )}

      <Composer
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        disabled={isClosed}
      />
    </div>
  )
}
