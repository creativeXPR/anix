import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import Card from '../../shared/components/Card.jsx'
import CardSkeleton from '../../shared/components/CardSkeleton.jsx'
import EmptyState from '../../shared/components/EmptyState.jsx'
import Page from '../../shared/components/Page.jsx'
import Spinner from '../../shared/components/Spinner.jsx'
import { useToast } from '../../shared/toast-store.js'
import { getChatsPrompt } from '../../shared/utils/greetings.js'
import { generateMessageImageBlob } from '../../shared/utils/message-image.js'
import DownloadIcon from '../../shared/icons/DownloadIcon.jsx'
import MessageIcon from '../../shared/icons/MessageIcon.jsx'
import { subscribeToInbox, subscribeToOwnedEndpoints } from './inbox.js'

// Creating/deleting/theming a link lives on Home (alongside rooms) —
// this screen is purely for reading what anonymous senders left you,
// across all of your endpoints, and turning one into a shareable image.
function EndpointInbox({ endpoint, onShare, onMessageCount }) {
  const [messages, setMessages] = useState(null)
  const [sharingId, setSharingId] = useState(null)

  useEffect(
    () =>
      subscribeToInbox(endpoint.id, (nextMessages) => {
        setMessages(nextMessages)
        onMessageCount(endpoint.id, nextMessages.length)
      }),
    [endpoint.id, onMessageCount],
  )

  async function handleShare(message) {
    setSharingId(message.id)
    try {
      await onShare(message, endpoint)
    } finally {
      setSharingId(null)
    }
  }

  return (
    <section className="home-section">
      <h3>{endpoint.handle}</h3>
      {messages === null ? (
        <CardSkeleton />
      ) : messages.length === 0 ? (
        <p className="text-b3">No messages yet.</p>
      ) : (
        messages.map((message) => (
          <Card key={message.id} icon={MessageIcon} title={message.text}>
            <div className="card__actions">
              <button
                type="button"
                className="card__pill-btn"
                onClick={() => handleShare(message)}
                disabled={sharingId === message.id}
              >
                {sharingId === message.id ? <Spinner size={14} /> : <DownloadIcon />}
                Copy as image
              </button>
            </div>
          </Card>
        ))
      )}
    </section>
  )
}

export default function InboxScreen() {
  const { user } = useAuthUser()
  const showToast = useToast()
  const [endpoints, setEndpoints] = useState(null)
  const [messageCounts, setMessageCounts] = useState({})

  useEffect(() => subscribeToOwnedEndpoints(user.uid, setEndpoints), [user.uid])

  const handleMessageCount = useCallback((endpointId, count) => {
    setMessageCounts((current) => ({ ...current, [endpointId]: count }))
  }, [])

  const hasMessages = Object.values(messageCounts).some((count) => count > 0)
  // Re-picked only when hasMessages actually flips, not on every render —
  // getChatsPrompt() randomizes each call, and messageCounts updates
  // constantly as Firestore snapshots land.
  const prompt = useMemo(() => getChatsPrompt(hasMessages), [hasMessages])

  async function handleShare(message, endpoint) {
    try {
      const blob = await generateMessageImageBlob(message.text, {
        bannerImageUrl: endpoint.bannerImageUrl,
        themeColor: endpoint.themeColor,
      })
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        showToast('Image copied — paste it into your status', 'success')
      } catch {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'anix-message.png'
        link.click()
        URL.revokeObjectURL(url)
        showToast('Image downloaded', 'success')
      }
    } catch {
      showToast('Could not generate image', 'error')
    }
  }

  return (
    <Page title="Chats">
      {endpoints !== null && endpoints.length > 0 && (
        <p className="page-greeting">
          {prompt.text} {prompt.emoji}
        </p>
      )}

      {endpoints === null ? (
        <CardSkeleton />
      ) : endpoints.length === 0 ? (
        <EmptyState icon={MessageIcon} title="Create an anonymous-message link on Home to start receiving messages" />
      ) : (
        endpoints.map((endpoint) => (
          <EndpointInbox
            key={endpoint.id}
            endpoint={endpoint}
            onShare={handleShare}
            onMessageCount={handleMessageCount}
          />
        ))
      )}
    </Page>
  )
}
