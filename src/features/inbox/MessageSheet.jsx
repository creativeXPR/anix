import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthUser } from '../../shared/auth-store.js'
import Button from '../../shared/components/Button.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import MessageCard from '../../shared/components/MessageCard.jsx'
import ReportSheet from '../../shared/components/ReportSheet.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import { gameOf, headerOf } from '../../shared/games.js'
import ShareIcon from '../../shared/icons/ShareIcon.jsx'
import TrashIcon from '../../shared/icons/TrashIcon.jsx'
import { useToast } from '../../shared/toast-store.js'
import { generateMessageImageBlob } from '../../shared/utils/message-image.js'
import { openThread } from '../threads/threads.js'
import { deleteReceivedMessage, isUnread, markMessageRead, REPORT_REASONS, reportReceivedMessage, saveAnswer } from './inbox.js'
import './MessageSheet.css'

const ANSWER_MAX = 500

// Opening one message: a sealed one flips open (and is marked read), then
// the owner can type an answer and share the card (+ answer) as a story
// image — NGL's core loop — reply privately (phase 2: opens an anonymous
// two-way thread), or delete it (behind the usual confirm). `thread` is
// the private conversation already opened for this message, if any.
export default function MessageSheet({ message, endpoint, thread, onClose }) {
  const showToast = useToast()
  const navigate = useNavigate()
  const { user } = useAuthUser()
  // Captured on open: was it sealed? (the snapshot flips to read quickly)
  const [wasSealed] = useState(() => isUnread(message))
  const [answer, setAnswer] = useState(message.answer || '')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(null) // 'preview' | 'share' | 'reply' | null
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const previewRef = useRef(null)

  useEffect(() => {
    if (wasSealed) markMessageRead(endpoint.id, message.id).catch(() => {})
  }, [wasSealed, endpoint.id, message.id])

  // Revoke the previous preview image when it's replaced / on close.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  // The owner's link travels with every share: printed on the image, in
  // the share text, and copied (story apps drop shared text — you add it
  // there as a link sticker).
  const shareLink = `${window.location.origin}/m/${endpoint.id}`
  const shareText = `send me anonymous messages 👀 ${shareLink}`

  const imageOptions = (withAnswer) => ({
    link: shareLink.replace(/^https?:\/\//, ''),
    text: message.text,
    header: headerOf(message),
    colors: gameOf(message.game).colors,
    answer: withAnswer ? answer.trim() : '',
    bannerImageUrl: endpoint.bannerImageUrl,
  })

  async function handlePreview() {
    setBusy('preview')
    try {
      const blob = await generateMessageImageBlob(imageOptions(true))
      setPreviewUrl(URL.createObjectURL(blob))
      requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    } catch {
      showToast('Could not make the image', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function handleShare() {
    setBusy('share')
    try {
      const trimmed = answer.trim()
      if (trimmed !== (message.answer || '')) await saveAnswer(endpoint.id, message.id, trimmed)
      const blob = await generateMessageImageBlob(imageOptions(true))
      await shareImage(blob, { link: shareLink, text: shareText }, showToast)
    } catch (err) {
      showToast(err.message || 'Could not share', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function handleReplyPrivately() {
    setBusy('reply')
    try {
      const threadId = await openThread({ endpoint, message, ownerId: user.uid })
      navigate(`/t/${threadId}`)
    } catch (err) {
      showToast(err.message, 'error')
      setBusy(null)
    }
  }

  async function handleDelete() {
    setConfirmingDelete(false)
    try {
      await deleteReceivedMessage(endpoint.id, message.id)
      showToast('Message deleted', 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <Sheet onClose={onClose}>
      {message.filtered && (
        <div className="filter-note">
          <span aria-hidden="true">🛡️</span>
          <span>Our filter hid this message because it may be offensive. You don&apos;t have to read it — you can delete or report it.</span>
        </div>
      )}
      <MessageCard
        message={message}
        className={`message-sheet__card${wasSealed ? ' message-sheet__card--reveal' : ''}`}
      />

      <textarea
        className="field"
        value={answer}
        onChange={(event) => setAnswer(event.target.value.slice(0, ANSWER_MAX))}
        placeholder="type your answer… (optional)"
        aria-label="Your answer"
        rows={3}
      />

      {previewUrl && (
        <img ref={previewRef} className="message-sheet__preview pop-in" src={previewUrl} alt="Story image preview" />
      )}

      <div className="sheet__actions">
        <Button variant="secondary" onClick={handlePreview} loading={busy === 'preview'} disabled={busy === 'share'}>
          Preview
        </Button>
        <Button variant="grad" onClick={handleShare} loading={busy === 'share'} disabled={busy === 'preview'}>
          <ShareIcon />
          {answer.trim() ? 'Answer & share' : 'Share'}
        </Button>
      </div>

      {/* Messages from before phase 2 have no thread id — no private reply. */}
      {message.threadId && (
        <Button variant="primary" block onClick={handleReplyPrivately} loading={busy === 'reply'}>
          💬 {thread ? 'Open private chat' : 'Reply privately'}
          {thread?.ownerUnread && <span className="message-sheet__dot" aria-label="new reply" />}
        </Button>
      )}

      <div className="message-sheet__minor">
        <Button variant="secondary" size="sm" onClick={() => setReporting(true)}>
          🚩 Report
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(true)}>
          <TrashIcon />
          Delete message
        </Button>
      </div>

      {reporting && (
        <ReportSheet
          title="report this message"
          reasons={REPORT_REASONS}
          onReport={(reason) => reportReceivedMessage(endpoint.id, message, reason)}
          onClose={() => setReporting(false)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="delete this message?"
          message="It's gone for good — this can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Sheet>
  )
}

// Native share sheet with the image + link text where supported (phones),
// else copy the image (with the link as its text form) to the clipboard,
// else download it. The link is also copied on its own first — story apps
// (Instagram, Snapchat) ignore shared text, so it's ready to paste as a
// link sticker.
async function shareImage(blob, { link, text }, showToast) {
  const file = new File([blob], 'anix-message.png', { type: 'image/png' })
  const copyLink = navigator.clipboard?.writeText(link).then(
    () => true,
    () => false,
  )
  // some share targets take files but not files + text — then image only
  const data = navigator.canShare?.({ files: [file], text })
    ? { files: [file], text }
    : navigator.canShare?.({ files: [file] })
      ? { files: [file] }
      : null
  if (data) {
    try {
      await navigator.share(data)
      if (await copyLink) showToast('Link copied too — add it as a link sticker 🔗', 'success')
      return
    } catch (err) {
      if (err?.name === 'AbortError') return // user closed the share sheet
    }
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob, 'text/plain': new Blob([text], { type: 'text/plain' }) }),
    ])
    showToast('Image copied (with your link) — paste it into your story 📸', 'success')
  } catch {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'anix-message.png'
    anchor.click()
    URL.revokeObjectURL(url)
    const copied = await copyLink
    showToast(copied ? 'Image downloaded 📸 — link copied too 🔗' : 'Image downloaded 📸', 'success')
  }
}
