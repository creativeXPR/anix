import { arrayUnion, collectionGroup, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import Spinner from '../../shared/components/Spinner.jsx'
import { db } from '../../shared/firebase.js'
import { resolveSender } from './sender-source.js'
import { ListBar, NoMatches, ShowMore } from './ListBar.jsx'
import { useListTools } from './list-tools.js'
import { ResolvedSender } from './SenderPattern.jsx'

// Every report (rooms, links, private chats) with what you need to act:
// the reported text, the sender's browser pattern, and Delete / Block /
// Close room — each behind a confirm.
const PLACE = { rooms: 'room', messageEndpoints: 'link', threads: 'thread' }

function formatTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : ''
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'room', label: 'Rooms' },
  { key: 'link', label: 'Links' },
  { key: 'thread', label: 'Private chats' },
]

export default function ReportsList({ onCount }) {
  const [reports, setReports] = useState(null)
  const [confirm, setConfirm] = useState(null) // { action, item }
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const q = query(collectionGroup(db, 'reports'), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) =>
        setReports(
          snap.docs.map((d) => ({
            id: d.id,
            // rooms/{id}/reports, messageEndpoints/{id}/reports, threads/{id}/reports
            where: PLACE[d.ref.parent.parent?.parent?.id] || 'room',
            parentId: d.ref.parent.parent?.id ?? '—',
            ...d.data(),
          })),
        ),
      (err) => {
        console.error('reports listen failed', err)
        setReports([])
      },
    )
  }, [])

  const tools = useListTools(reports, {
    match: (item, key) => item.where === key,
    text: (item) => `${item.text || ''} ${item.reason || ''} ${item.parentId || ''}`,
  })
  const total = reports?.length
  useEffect(() => {
    if (total !== undefined) onCount?.(total)
  }, [total, onCount])

  async function run() {
    const { action, item } = confirm
    setConfirm(null)
    try {
      if (action === 'delete') {
        const col = item.where === 'room' ? 'rooms' : item.where === 'thread' ? 'threads' : 'messageEndpoints'
        await deleteDoc(doc(db, col, item.parentId, 'messages', item.messageId))
        setNotice('Message deleted.')
      } else if (action === 'close') {
        await updateDoc(doc(db, 'rooms', item.parentId), { status: 'closed' })
        setNotice('Room closed.')
      } else {
        const source = await resolveSender({ where: item.where, parentId: item.parentId, messageId: item.messageId, by: item.by })
        if (source?.kind !== 'link') throw new Error('Only anonymous senders of a link can be blocked this way.')
        await updateDoc(doc(db, 'messageEndpoints', source.endpointId), { blocked: arrayUnion(source.senderKey) })
        setNotice('Sender blocked from that link.')
      }
    } catch (err) {
      setNotice(err.message)
    }
  }

  const label = (item) =>
    item.where === 'link'
      ? `🚩 link ${item.parentId}`
      : item.where === 'thread'
        ? `🚩 private chat (reported by the ${item.by === 'owner' ? 'link owner' : 'anonymous side'})`
        : `🚩 room ${item.parentId}`

  return (
    <section>
      <ListBar tools={tools} filters={FILTERS} placeholder="Search text, reason or id…" />
      {notice && <p className="admin-notice">{notice}</p>}
      {reports === null ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : tools.filtered.length === 0 ? (
        <NoMatches tools={tools}>No reports yet. 🎉</NoMatches>
      ) : (
        <div className="admin-list">
          {tools.visible.map((item) => (
            <div key={`${item.where}-${item.parentId}-${item.id}`} className="admin-card admin-card--urgent">
              <div className="admin-card__meta">
                <span>
                  {label(item)}
                  {item.reason ? ` · ${item.reason}` : ''}
                </span>
                <span>{formatTimestamp(item.createdAt)}</span>
              </div>
              <p className="admin-card__text">{item.text || `(no copy of the text — message ${item.messageId})`}</p>
              {item.stickerUrl && <img className="admin-sticker" src={item.stickerUrl} alt="reported sticker" />}
              <ResolvedSender
                target={{ where: item.where, parentId: item.parentId, messageId: item.messageId, by: item.by, message: item.senderId ? { senderId: item.senderId } : null }}
              />
              <div className="admin-card__actions">
                {item.where !== 'room' && !(item.where === 'thread' && item.by === 'sender') && (
                  <button type="button" onClick={() => setConfirm({ action: 'block', item })}>
                    Block sender
                  </button>
                )}
                {item.where === 'room' && (
                  <button type="button" onClick={() => setConfirm({ action: 'close', item })}>
                    Close room
                  </button>
                )}
                {item.messageId && (
                  <button type="button" className="danger" onClick={() => setConfirm({ action: 'delete', item })}>
                    Delete message
                  </button>
                )}
              </div>
            </div>
          ))}
          <ShowMore tools={tools} />
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'delete' ? 'delete this message?' : confirm.action === 'close' ? 'close this room?' : 'block this sender?'}
          message={
            confirm.action === 'delete'
              ? 'It is removed for good.'
              : confirm.action === 'close'
                ? 'Nobody can send in it until its owner opens it again.'
                : 'Their browser can no longer send anything to that link (best-effort — clearing site data gets around it).'
          }
          confirmLabel={confirm.action === 'delete' ? 'Delete' : confirm.action === 'close' ? 'Close room' : 'Block'}
          onConfirm={run}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  )
}
