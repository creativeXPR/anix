import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthUser } from '../../shared/auth-store.js'
import { usePopOnNew } from '../../shared/hooks/use-pop-on-new.js'
import Button from '../../shared/components/Button.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import MessageCard from '../../shared/components/MessageCard.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import ArrowRightIcon from '../../shared/icons/ArrowRightIcon.jsx'
import BackIcon from '../../shared/icons/BackIcon.jsx'
import { pushConfigured } from '../../shared/notifications.js'
import { useToast } from '../../shared/toast-store.js'
import { messageGradientVars } from '../../shared/utils/message-gradient.js'
import '../chatroom/components/Composer.css'
import '../chatroom/components/MessageBubble.css'
import {
  blockThreadSender,
  endThread,
  getRememberedThread,
  markThreadSeen,
  sendThreadMessage,
  subscribeToThread,
  subscribeToThreadMessages,
} from './threads.js'
import NotifyMeButton from './NotifyMeButton.jsx'
import './ThreadScreen.css'

// One private anonymous conversation (phase 2), for both sides:
//  - the link owner (signed in, thread.ownerId) — sees "anonymous";
//  - the sender (anyone holding the secret thread id) — sees @handle.
// Neither side ever learns who the other is.
export default function ThreadScreen() {
  const { threadId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { user, loading: authLoading } = useAuthUser()
  const [thread, setThread] = useState(undefined) // undefined = loading, null = not opened yet
  const [messages, setMessages] = useState(null) // null until the first snapshot
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(null) // 'end' | 'block' | null
  const scrollRef = useRef(null)
  const remembered = getRememberedThread(threadId)

  useEffect(() => subscribeToThread(threadId, setThread, () => setThread(null)), [threadId])
  useEffect(() => (thread ? subscribeToThreadMessages(threadId, setMessages) : undefined), [threadId, thread])

  const side = thread && user && thread.ownerId === user.uid ? 'owner' : 'sender'
  // Pop when the other side sends something while this is open.
  const fromOtherSide = useCallback((message) => message.from !== side, [side])
  usePopOnNew(messages || [], { ready: messages !== null, isIncoming: fromOtherSide })
  const ready = thread !== undefined && !authLoading
  const unreadForMe = thread && (side === 'owner' ? thread.ownerUnread : thread.senderUnread)

  // Seeing the thread clears your side's unread flag.
  useEffect(() => {
    if (ready && unreadForMe) markThreadSeen(threadId, side).catch(() => {})
  }, [ready, unreadForMe, threadId, side])

  // Keep the newest message in view.
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }, [messages?.length])

  const ended = thread?.status === 'ended'

  async function handleSend() {
    if (!text.trim() || ended || sending) return
    setSending(true)
    const draft = text
    setText('')
    try {
      await sendThreadMessage(threadId, side, draft)
    } catch {
      setText(draft)
      showToast("Couldn't send — this conversation may have ended", 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleConfirm() {
    const action = confirming
    setConfirming(null)
    setMenuOpen(false)
    try {
      if (action === 'block') {
        await blockThreadSender(thread)
        showToast('Blocked — they can’t message this link again', 'success')
      } else {
        await endThread(threadId)
        showToast('Conversation ended', 'success')
      }
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const backTo = side === 'owner' ? '/chats' : thread?.endpointId || remembered?.endpointId ? `/m/${thread?.endpointId || remembered.endpointId}` : '/'
  const original = thread?.message || (remembered && { text: remembered.text, game: remembered.game, prompt: remembered.prompt })

  return (
    <div className="thread" style={messageGradientVars(thread?.themeColor)}>
      <header className="thread__header">
        <button type="button" className="thread__icon-btn" onClick={() => navigate(backTo)} aria-label="Back">
          <BackIcon />
        </button>
        <div className="thread__title">
          <h1>
            {side === 'owner' ? (
              'anonymous 👻'
            ) : (
              <>
                <span className="thread__at">@</span>
                {thread?.handle || remembered?.handle || '…'}
              </>
            )}
          </h1>
          <small>{side === 'owner' ? `private chat on @${thread?.handle}` : "private chat · you're anonymous"}</small>
        </div>
        {side === 'owner' && thread && !ended && (
          <button type="button" className="thread__icon-btn" onClick={() => setMenuOpen(true)} aria-label="Conversation options">
            ⋯
          </button>
        )}
      </header>

      <div className="thread__body" ref={scrollRef}>
        {original && (
          <div className="thread__original">
            <small>{side === 'owner' ? 'their message' : 'your message'}</small>
            <MessageCard message={original} />
          </div>
        )}

        {!ready ? null : thread === null ? (
          <div className="thread__waiting pop-in">
            <span aria-hidden="true">⏳</span>
            <h2>no reply yet</h2>
            <p>If they reply privately, it shows up right here — keep this page (or its link) to come back.</p>
            {pushConfigured() && <NotifyMeButton threadId={threadId} />}
          </div>
        ) : (
          <>
            {messages?.length === 0 && (
              <p className="thread__hint">
                {side === 'owner'
                  ? "reply privately — only they'll see it, and you still won't know who they are 👀"
                  : 'they opened a private chat with you 👀'}
              </p>
            )}
            {(messages || []).map((message, index) => {
              const mine = message.from === side
              const showGap = index > 0 && messages[index - 1].from !== message.from
              return (
                <div
                  key={message.id}
                  className={`bubble-row${mine ? ' bubble-row--own' : ''}`}
                  style={showGap ? { marginTop: 14 } : undefined}
                >
                  <div className="bubble-wrap">
                    <div className={`bubble ${mine ? 'bubble--own' : 'bubble--other'}`}>
                      <p className="bubble__text">{message.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            {side === 'sender' && pushConfigured() && !ended && <NotifyMeButton threadId={threadId} compact />}
          </>
        )}
      </div>

      {ended && <div className="thread__ended">🔒 this conversation has ended</div>}

      {thread && !ended && (
        <div className="composer">
          <div className="composer__row">
            <textarea
              className="composer__input"
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 1000))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              placeholder={side === 'owner' ? 'reply privately…' : 'reply anonymously…'}
              aria-label="Message"
              rows={1}
            />
            <button
              type="button"
              className="composer__send"
              onClick={handleSend}
              disabled={!text.trim() || sending}
              aria-label="Send"
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <Sheet onClose={() => setMenuOpen(false)}>
          <h2>conversation</h2>
          <Button variant="secondary" block onClick={() => setConfirming('end')}>
            End conversation
          </Button>
          <Button variant="danger" block onClick={() => setConfirming('block')}>
            Block this sender
          </Button>
          <p className="thread__note">
            Blocking stops this browser from sending anything else to @{thread?.handle}. You still won't know who it was.
          </p>
        </Sheet>
      )}
      {confirming && (
        <ConfirmDialog
          title={confirming === 'block' ? 'block this sender?' : 'end this conversation?'}
          message={
            confirming === 'block'
              ? 'They won’t be able to message this link again, and this conversation ends.'
              : 'Neither of you can send anything else. The messages stay readable.'
          }
          confirmLabel={confirming === 'block' ? 'Block' : 'End it'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  )
}
