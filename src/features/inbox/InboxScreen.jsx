import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthUser } from '../../shared/auth-store.js'
import CardSkeleton from '../../shared/components/CardSkeleton.jsx'
import FunEmpty from '../../shared/components/FunEmpty.jsx'
import MessageCard from '../../shared/components/MessageCard.jsx'
import Page from '../../shared/components/Page.jsx'
import { gameGradientVars } from '../../shared/games.js'
import { useCopyLink } from '../../shared/hooks/use-copy-link.js'
import { timeAgo } from '../../shared/utils/time-ago.js'
import { isUnread, subscribeToInbox, subscribeToOwnedEndpoints } from './inbox.js'
import MessageSheet from './MessageSheet.jsx'
import './InboxScreen.css'

// A stable small tilt per message (±2°), so cards sit like scattered
// stickers (#004-E) without jumping around on every re-render.
function tiltFor(id) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `${((Math.abs(hash) % 400) / 100 - 2).toFixed(2)}deg`
}

// Creating/deleting/theming a link lives on Home — this screen is for
// reading what anonymous senders left you, across all your links. Unread
// messages are sealed tiles (NGL's "new message!" envelopes); tapping any
// tile opens MessageSheet (reveal → answer & share / delete).
export default function InboxScreen() {
  const { user } = useAuthUser()
  const navigate = useNavigate()
  const copyLink = useCopyLink()
  const [endpoints, setEndpoints] = useState(null)
  const [inboxes, setInboxes] = useState({}) // endpointId -> messages
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  useEffect(() => subscribeToOwnedEndpoints(user.uid, setEndpoints), [user.uid])

  useEffect(() => {
    const unsubscribes = (endpoints || []).map((endpoint) =>
      subscribeToInbox(endpoint.id, (messages) => setInboxes((current) => ({ ...current, [endpoint.id]: messages }))),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [endpoints])

  const endpointById = useMemo(() => Object.fromEntries((endpoints || []).map((e) => [e.id, e])), [endpoints])
  const loaded = endpoints !== null && endpoints.every((endpoint) => inboxes[endpoint.id])

  // One feed across every link, newest first. A brand-new message's
  // createdAt is briefly null (serverTimestamp pending) — it sorts first.
  const messages = useMemo(() => {
    const all = Object.entries(inboxes).flatMap(([endpointId, list]) =>
      endpointById[endpointId] ? list.map((message) => ({ ...message, endpointId })) : [],
    )
    const time = (message) => message.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER
    return all.sort((a, b) => time(b) - time(a))
  }, [inboxes, endpointById])

  const visible = filter === 'all' ? messages : messages.filter((message) => message.endpointId === filter)

  const unreadCount = messages.filter(isUnread).length
  const subtitle = !loaded
    ? ' '
    : messages.length === 0
      ? 'nothing yet — share your link 📭'
      : unreadCount > 0
        ? `${unreadCount} unopened 👀 tap to reveal`
        : 'all caught up ✨'
  const openMessage = openId && messages.find((message) => message.id === openId)

  return (
    <Page title="inbox">
      <p className="inbox-sub">{subtitle}</p>

      {endpoints !== null && endpoints.length > 1 && (
        <div className="inbox-filters" role="tablist" aria-label="Filter by link">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className="chip"
            onClick={() => setFilter('all')}
          >
            all
          </button>
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              type="button"
              role="tab"
              aria-selected={filter === endpoint.id}
              className="chip"
              onClick={() => setFilter(endpoint.id)}
            >
              @{endpoint.handle}
            </button>
          ))}
        </div>
      )}

      {endpoints === null || !loaded ? (
        <CardSkeleton />
      ) : endpoints.length === 0 ? (
        <FunEmpty
          emoji="📭"
          title="no link, no tea"
          text="make an anonymous-message link on Home and the messages land here"
          cta="Make a link"
          onClick={() => navigate('/')}
        />
      ) : visible.length === 0 ? (
        <FunEmpty
          emoji="🦗"
          title="crickets…"
          text="share your link and let the chaos begin 👀"
          cta="Copy your link"
          onClick={() => {
            const endpoint = endpointById[filter] || endpoints[0]
            copyLink(`${window.location.origin}/m/${endpoint.id}/${endpoint.handle}`)
          }}
        />
      ) : (
        <div className="inbox-grid">
          {visible.map((message, index) => {
            const endpoint = endpointById[message.endpointId]
            const style = { '--tilt': tiltFor(message.id), animationDelay: `${Math.min(index, 8) * 40}ms` }
            return isUnread(message) ? (
              <button
                key={message.id}
                type="button"
                className="inbox-card inbox-sealed pop-in"
                style={{ ...gameGradientVars(message.game), ...style }}
                onClick={() => setOpenId(message.id)}
                aria-label={`New message on @${endpoint.handle}, tap to open`}
              >
                <span className="inbox-sealed__env" aria-hidden="true">
                  💌
                </span>
                <b>new message!</b>
                <small>
                  {timeAgo(message.createdAt)} · @{endpoint.handle}
                </small>
              </button>
            ) : (
              <MessageCard
                key={message.id}
                message={message}
                className="inbox-card"
                style={style}
                onClick={() => setOpenId(message.id)}
                footer={
                  <>
                    <span>
                      {timeAgo(message.createdAt)} · @{endpoint.handle}
                    </span>
                    {message.answer && <span className="inbox-answered">✓ answered</span>}
                  </>
                }
              />
            )
          })}
        </div>
      )}

      {openMessage && (
        <MessageSheet
          key={openMessage.id}
          message={openMessage}
          endpoint={endpointById[openMessage.endpointId]}
          onClose={() => setOpenId(null)}
        />
      )}
    </Page>
  )
}
