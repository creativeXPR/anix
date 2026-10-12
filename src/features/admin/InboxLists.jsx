import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Spinner from '../../shared/components/Spinner.jsx'
import { db } from '../../shared/firebase.js'
import { ListBar, NoMatches, ShowMore } from './ListBar.jsx'
import { useListTools } from './list-tools.js'

// Feedback (Profile's "talk to us") and Contact (/welcome/contact) lists.
function useCollection(name) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    const q = query(collection(db, name), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(`${name} listen failed`, err)
        setItems([])
      },
    )
  }, [name])
  return items
}

function useReportCount(items, onCount) {
  useEffect(() => {
    if (items) onCount?.(items.length)
  }, [items, onCount])
}

function formatTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : ''
}

// Older feedback has no `kind`.
const FEEDBACK_KINDS = { bug: '🐞 bug', idea: '💡 idea', love: '💜 love' }
const FEEDBACK_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bug', label: '🐞 Bugs' },
  { key: 'idea', label: '💡 Ideas' },
  { key: 'love', label: '💜 Love' },
  { key: 'other', label: 'Untagged' },
]

export function FeedbackList({ onCount }) {
  const items = useCollection('feedback')
  useReportCount(items, onCount)
  const tools = useListTools(items, {
    match: (item, key) => (key === 'other' ? !FEEDBACK_KINDS[item.kind] : item.kind === key),
    text: (item) => `${item.text || ''} ${item.userId || ''}`,
  })

  return (
    <section>
      <ListBar tools={tools} filters={FEEDBACK_FILTERS} placeholder="Search feedback…" />
      {items === null ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : tools.filtered.length === 0 ? (
        <NoMatches tools={tools}>No feedback yet.</NoMatches>
      ) : (
        <div className="admin-list">
          {tools.visible.map((item) => (
            <div key={item.id} className={`admin-card admin-card--${FEEDBACK_KINDS[item.kind] ? item.kind : 'plain'}`}>
              <div className="admin-card__meta">
                <span>
                  {FEEDBACK_KINDS[item.kind] ? `${FEEDBACK_KINDS[item.kind]} · ` : ''}user {item.userId}
                </span>
                <span>{formatTimestamp(item.createdAt)}</span>
              </div>
              <p className="admin-card__text">{item.text}</p>
            </div>
          ))}
          <ShowMore tools={tools} />
        </div>
      )}
    </section>
  )
}

const CONTACT_TOPICS = ['question', 'idea', 'bug', 'safety report', 'business', 'other']
const CONTACT_FILTERS = [
  { key: 'all', label: 'All' },
  ...CONTACT_TOPICS.map((t) => ({ key: t, label: t[0].toUpperCase() + t.slice(1) })),
]

export function ContactList({ onCount }) {
  const items = useCollection('contact')
  useReportCount(items, onCount)
  const tools = useListTools(items, {
    match: (item, key) => item.topic === key,
    text: (item) => `${item.message || ''} ${item.email || ''}`,
  })

  return (
    <section>
      <ListBar tools={tools} filters={CONTACT_FILTERS} placeholder="Search messages or emails…" />
      {items === null ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : tools.filtered.length === 0 ? (
        <NoMatches tools={tools}>No contact messages yet.</NoMatches>
      ) : (
        <div className="admin-list">
          {tools.visible.map((item) => (
            <div key={item.id} className={`admin-card${item.topic === 'safety report' ? ' admin-card--urgent' : ''}`}>
              <div className="admin-card__meta">
                <span>
                  {item.topic}
                  {item.email ? (
                    <>
                      {' · '}
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                    </>
                  ) : (
                    ' · no reply email'
                  )}
                </span>
                <span>{formatTimestamp(item.createdAt)}</span>
              </div>
              <p className="admin-card__text">{item.message}</p>
            </div>
          ))}
          <ShowMore tools={tools} />
        </div>
      )}
    </section>
  )
}
