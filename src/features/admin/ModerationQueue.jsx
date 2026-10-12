import { arrayUnion, collectionGroup, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import Spinner from '../../shared/components/Spinner.jsx'
import { db } from '../../shared/firebase.js'
import { ListBar, NoMatches, ShowMore } from './ListBar.jsx'
import { useListTools } from './list-tools.js'
import { ResolvedSender } from './SenderPattern.jsx'

// Moderation queue (2026-10-12): messages the automated filter hid
// (`filtered`) or couldn't check (`moderation.unchecked`), across every
// anonymous link and private conversation — newest first. The admin can
// delete one or block its sender from the link it was sent to.
function useQueue(field, value) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    const q = query(collectionGroup(db, 'messages'), where(field, '==', value), orderBy('createdAt', 'desc'), limit(100))
    return onSnapshot(
      q,
      (snap) =>
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ref: d.ref,
            // messageEndpoints/{id}/messages/{id}  or  threads/{id}/messages/{id}
            where: d.ref.parent.parent?.parent?.id === 'threads' ? 'thread' : 'link',
            parentId: d.ref.parent.parent?.id,
            ...d.data(),
          })),
        ),
      (err) => {
        console.error(`moderation queue (${field}) failed`, err)
        setItems([])
      },
    )
  }, [field, value])
  return items
}

function formatTimestamp(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : ''
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'filtered', label: '🛡️ Filtered' },
  { key: 'unchecked', label: '⚠️ Unchecked' },
  { key: 'link', label: 'Links' },
  { key: 'thread', label: 'Private chats' },
]

export default function ModerationQueue({ onCount }) {
  const filtered = useQueue('filtered', true)
  const unchecked = useQueue('moderation.unchecked', true)
  const [confirm, setConfirm] = useState(null) // { action: 'delete' | 'block', item }
  const [notice, setNotice] = useState('')

  const items =
    filtered && unchecked
      ? [...filtered, ...unchecked.filter((u) => !filtered.some((f) => f.ref.path === u.ref.path))].sort(
        (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
      )
      : null
  const tools = useListTools(items, {
    match: (item, key) =>
      key === 'filtered' ? item.filtered : key === 'unchecked' ? !item.filtered : item.where === key,
    text: (item) => `${item.text || ''} ${item.parentId || ''} ${(item.moderation?.categories || []).join(' ')}`,
  })
  const total = items?.length
  useEffect(() => {
    if (total !== undefined) onCount?.(total)
  }, [total, onCount])

  async function run() {
    const { action, item } = confirm
    setConfirm(null)
    try {
      if (action === 'delete') {
        await deleteDoc(item.ref)
        setNotice('Message deleted.')
      } else {
        // block the browser that sent it, on the link it was sent to
        let endpointId = item.parentId
        let senderKey = item.senderKey
        if (item.where === 'thread') {
          const thread = (await getDoc(doc(db, 'threads', item.parentId))).data()
          endpointId = thread?.endpointId
          senderKey = thread?.senderKey
          if (item.from !== 'sender') throw new Error('That message is from the link owner, not an anonymous sender.')
        }
        if (!endpointId || !senderKey) throw new Error('This message has no sender key to block (sent before blocking existed).')
        await updateDoc(doc(db, 'messageEndpoints', endpointId), { blocked: arrayUnion(senderKey) })
        setNotice('Sender blocked from that link.')
      }
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <section>
      <ListBar tools={tools} filters={FILTERS} placeholder="Search text, link or category…" />
      {notice && <p className="admin-notice">{notice}</p>}
      {items === null ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : tools.filtered.length === 0 ? (
        <NoMatches tools={tools}>Nothing filtered or unchecked. 🎉</NoMatches>
      ) : (
        <div className="admin-list">
          {tools.visible.map((item) => (
            <div key={item.ref.path} className={`admin-card ${item.filtered ? 'admin-card--urgent' : 'admin-card--warn'}`}>
              <div className="admin-card__meta">
                <span>
                  {item.filtered ? '🛡️ filtered' : '⚠️ unchecked'} · {item.where === 'thread' ? `private chat (${item.from})` : `link ${item.parentId}`}
                </span>
                <span>{formatTimestamp(item.createdAt)}</span>
              </div>
              <p className="admin-card__text">{item.text}</p>
              {item.moderation?.categories?.length > 0 && (
                <p className="admin-card__tags">
                  {item.moderation.categories.map((c) => (
                    <span key={c}>
                      {c} {Math.round((item.moderation.scores?.[c] ?? 0) * 100)}%
                    </span>
                  ))}
                </p>
              )}
              <ResolvedSender target={{ where: item.where, parentId: item.parentId, message: item }} />
              <div className="admin-card__actions">
                <button type="button" onClick={() => setConfirm({ action: 'block', item })}>
                  Block sender
                </button>
                <button type="button" className="danger" onClick={() => setConfirm({ action: 'delete', item })}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          <ShowMore tools={tools} />
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'delete' ? 'delete this message?' : 'block this sender?'}
          message={
            confirm.action === 'delete'
              ? 'It is removed for good — from the inbox and the filtered folder.'
              : 'Their browser can no longer send anything to that link (best-effort — clearing site data gets around it).'
          }
          confirmLabel={confirm.action === 'delete' ? 'Delete' : 'Block'}
          onConfirm={run}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  )
}
