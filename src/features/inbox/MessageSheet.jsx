import { useEffect, useRef, useState } from 'react'
import Button from '../../shared/components/Button.jsx'
import ConfirmDialog from '../../shared/components/ConfirmDialog.jsx'
import MessageCard from '../../shared/components/MessageCard.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import { gameOf, headerOf } from '../../shared/games.js'
import ShareIcon from '../../shared/icons/ShareIcon.jsx'
import TrashIcon from '../../shared/icons/TrashIcon.jsx'
import { useToast } from '../../shared/toast-store.js'
import { generateMessageImageBlob } from '../../shared/utils/message-image.js'
import { deleteReceivedMessage, isUnread, markMessageRead, saveAnswer } from './inbox.js'
import './MessageSheet.css'

const ANSWER_MAX = 500

// Opening one message: a sealed one flips open (and is marked read), then
// the owner can type an answer and share the card (+ answer) as a story
// image — NGL's core loop — or delete it (behind the usual confirm).
export default function MessageSheet({ message, endpoint, onClose }) {
  const showToast = useToast()
  // Captured on open: was it sealed? (the snapshot flips to read quickly)
  const [wasSealed] = useState(() => isUnread(message))
  const [answer, setAnswer] = useState(message.answer || '')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(null) // 'preview' | 'share' | null
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const previewRef = useRef(null)

  useEffect(() => {
    if (wasSealed) markMessageRead(endpoint.id, message.id).catch(() => {})
  }, [wasSealed, endpoint.id, message.id])

  // Revoke the previous preview image when it's replaced / on close.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const imageOptions = (withAnswer) => ({
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
      await shareImage(blob, showToast)
    } catch (err) {
      showToast(err.message || 'Could not share', 'error')
    } finally {
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

      <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(true)} style={{ alignSelf: 'center' }}>
        <TrashIcon />
        Delete message
      </Button>

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

// Native share sheet with the image where supported (phones), else copy
// the image to the clipboard, else download it.
async function shareImage(blob, showToast) {
  const file = new File([blob], 'anix-message.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      if (err?.name === 'AbortError') return // user closed the share sheet
    }
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    showToast('Image copied — paste it into your story 📸', 'success')
  } catch {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'anix-message.png'
    link.click()
    URL.revokeObjectURL(url)
    showToast('Image downloaded 📸', 'success')
  }
}
