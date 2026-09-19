import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../shared/components/Button.jsx'
import { db } from '../../shared/firebase.js'
import { themeStyleVars } from '../../shared/utils/theme-vars.js'
import { sendAnonymousMessage } from '../inbox/inbox.js'
import './AnonymousMessageScreen.css'

export default function AnonymousMessageScreen() {
  const { userId: endpointId } = useParams()
  const [endpoint, setEndpoint] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'messageEndpoints', endpointId)).then((snapshot) => {
      setEndpoint(snapshot.exists() ? snapshot.data() : null)
    })
  }, [endpointId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim()) return
    setError(null)
    setSending(true)
    try {
      await sendAnonymousMessage(endpointId, text)
      setSent(true)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="anon-message" style={themeStyleVars(endpoint?.themeColor)}>
      <header className="anon-message__header">
        {endpoint?.bannerImageUrl ? (
          <img className="anon-message__banner" src={endpoint.bannerImageUrl} alt="" />
        ) : (
          <div className="anon-message__banner anon-message__banner--placeholder">
            <img src="/icon.jpg" alt="" className="anon-message__logo" />
          </div>
        )}
      </header>

      <div className="anon-message__body">
        {sent ? (
          <>
            <h1>Message sent</h1>
            <p className="text-b3">Your message was delivered anonymously.</p>
            <Button onClick={() => setSent(false)}>Send another message</Button>
          </>
        ) : (
          <>
            <h1>Send {endpoint?.handle || 'them'} an anonymous message</h1>

            <form className="anon-message__form" onSubmit={handleSubmit}>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type your anonymous message…"
                rows={5}
                required
              />
              {error && <p className="error-text text-b3">{error}</p>}
              <Button type="submit" loading={sending}>
                {sending ? 'Sending…' : 'Send anonymously'}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
