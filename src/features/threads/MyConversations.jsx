import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePopOnIncrease } from '../../shared/hooks/use-pop-on-new.js'
import { getMyThreads, subscribeToThread } from './threads.js'

const SHOWN = 5

// Sender page: "your conversations with @handle" — the messages THIS
// browser sent to the link, each with its live status (has the owner
// opened a private chat? replied?). Purely local: nothing here tells the
// owner which messages came from the same browser.
export default function MyConversations({ endpointId, handle }) {
  const [mine] = useState(() => getMyThreads(endpointId).slice(0, SHOWN))
  const [threads, setThreads] = useState({}) // threadId -> thread | null

  useEffect(() => {
    const unsubscribes = mine.map(({ threadId }) =>
      subscribeToThread(
        threadId,
        (thread) => setThreads((current) => ({ ...current, [threadId]: thread })),
        () => setThreads((current) => ({ ...current, [threadId]: null })),
      ),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [mine])

  // Pop when the owner replies while the sender is on the link page.
  const newReplies = Object.values(threads).filter((thread) => thread?.senderUnread).length
  usePopOnIncrease(newReplies, Object.keys(threads).length === mine.length)

  if (mine.length === 0) return null

  return (
    <section className="my-convos" aria-label={`Your conversations with @${handle || 'them'}`}>
      <p className="my-convos__title">your messages to @{handle || '…'}</p>
      {mine.map(({ threadId, text }) => {
        const thread = threads[threadId]
        const status = !thread
          ? { label: 'no reply yet', tone: 'muted' }
          : thread.senderUnread
            ? { label: 'new reply! 💌', tone: 'new' }
            : thread.status === 'ended'
              ? { label: 'ended', tone: 'muted' }
              : { label: 'private chat open', tone: 'open' }
        return (
          <Link key={threadId} to={`/t/${threadId}`} className="my-convos__row">
            <span className="my-convos__text">{text}</span>
            <span className={`my-convos__status my-convos__status--${status.tone}`}>{status.label}</span>
          </Link>
        )
      })}
    </section>
  )
}
