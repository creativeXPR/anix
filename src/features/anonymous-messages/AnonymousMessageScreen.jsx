import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../shared/components/Button.jsx'
import { db } from '../../shared/firebase.js'
import { gameGradientVars, gameOf, promptOf, randomDice } from '../../shared/games.js'
import { messageGradientVars } from '../../shared/utils/message-gradient.js'
import { sendAnonymousMessage } from '../inbox/inbox.js'
import './AnonymousMessageScreen.css'

export default function AnonymousMessageScreen() {
  const { userId: endpointId } = useParams()
  // undefined = still loading, null = no such link (deleted or mistyped).
  const [endpoint, setEndpoint] = useState(undefined)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [rolling, setRolling] = useState(false)

  function handleDice() {
    setText((current) => randomDice(endpoint?.game, current))
    setRolling(false)
    requestAnimationFrame(() => setRolling(true))
  }

  useEffect(() => {
    getDoc(doc(db, 'messageEndpoints', endpointId))
      .then((snapshot) => setEndpoint(snapshot.exists() ? snapshot.data() : null))
      .catch(() => setEndpoint(null))
  }, [endpointId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim()) return
    setError(null)
    setSending(true)
    try {
      await sendAnonymousMessage(endpointId, text, { game: endpoint?.game || null, prompt: promptOf(endpoint) })
      setSent(true)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const avatarUrl = endpoint?.bannerImageUrl || '/icon.svg'

  // NGL's compose screen: full gradient page, one card whose white header
  // carries who you're writing to, and the textarea as the card's body.
  // Themed by the endpoint's color via the same gradient the receiver's
  // MessageCard / share image use, so both sides look like one object.
  return (
    <section className="anon-message" style={messageGradientVars(endpoint?.themeColor)}>
      <div className="anon-message__inner">
        {endpoint === null ? (
          <div className="anon-message__sent">
            <h1>link not found</h1>
            <p>This anonymous-message link doesn't exist or was deleted.</p>
            <GetYourOwn />
          </div>
        ) : sent ? (
          <div className="anon-message__sent">
            <div className="anon-message__sent-check" aria-hidden="true">✓</div>
            <h1>sent!</h1>
            <p>Your message was delivered anonymously 🤫</p>
            <Button className="anon-message__send" onClick={() => setSent(false)}>
              Send another
            </Button>
            <GetYourOwn />
          </div>
        ) : (
          <form className="anon-message__form" onSubmit={handleSubmit}>
            <div className="anon-message__card">
              <header className="anon-message__card-header">
                <img className="anon-message__avatar" src={avatarUrl} alt="" />
                <div>
                  <strong className="anon-message__handle">
                    @{endpoint?.handle || '…'}
                    {endpoint?.game && (
                      <span className="anon-message__game" style={gameGradientVars(endpoint.game)}>
                        {endpoint.game === 'custom' ? 'custom' : gameOf(endpoint.game).title}
                      </span>
                    )}
                  </strong>
                  <span className="anon-message__prompt">{promptOf(endpoint)}</span>
                </div>
              </header>
              <div className="anon-message__box">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={`${promptOf(endpoint)}…`}
                  aria-label={`Anonymous message to ${endpoint?.handle || 'this person'}`}
                  rows={5}
                  maxLength={1000}
                  required
                />
                {/* NGL's dice: fills in a random idea for this link's game. */}
                <button
                  type="button"
                  className={`anon-message__dice${rolling ? ' anon-message__dice--roll' : ''}`}
                  onClick={handleDice}
                  aria-label="Give me an idea"
                  title="Give me an idea"
                >
                  🎲
                </button>
              </div>
            </div>

            <p className="anon-message__note">🔒 anonymous q&amp;a</p>

            {error && <p className="anon-message__error">{error}</p>}
            <Button type="submit" className="anon-message__send" loading={sending} disabled={!text.trim()}>
              {sending ? 'Sending…' : 'Send!'}
            </Button>
            <GetYourOwn />
          </form>
        )}
      </div>
    </section>
  )
}

// NGL's growth loop: every visitor is one tap from making their own link.
function GetYourOwn() {
  return (
    <Link to="/auth" className="btn btn--block anon-message__own">
      get your own messages!
    </Link>
  )
}
