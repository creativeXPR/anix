import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { EmojiPanelSlot, EmojiToggle } from '../../shared/emoji/EmojiToggle.jsx'
import { useEmojiInput } from '../../shared/emoji/use-emoji-input.js'
import { Link, useParams } from 'react-router-dom'
import Button from '../../shared/components/Button.jsx'
import { db } from '../../shared/firebase.js'
import { gameGradientVars, gameOf, promptOf, randomDice } from '../../shared/games.js'
import { messageGradientVars } from '../../shared/utils/message-gradient.js'
import { sendAnonymousMessage } from '../inbox/inbox.js'
import MyConversations from '../threads/MyConversations.jsx'
import NotifyMeButton from '../threads/NotifyMeButton.jsx'
import { getSenderKey, rememberMyThread, secureId, threadLink } from '../threads/threads.js'
import { useCopyLink } from '../../shared/hooks/use-copy-link.js'
import { pushConfigured } from '../../shared/notifications.js'
import './AnonymousMessageScreen.css'

export default function AnonymousMessageScreen() {
  const { userId: endpointId } = useParams()
  // undefined = still loading, null = no such link (deleted or mistyped).
  const [endpoint, setEndpoint] = useState(undefined)
  const [text, setText] = useState('')
  const textRef = useRef(null)
  const emoji = useEmojiInput({ inputRef: textRef, value: text, setValue: setText, maxLength: 1000 })
  const [sending, setSending] = useState(false)
  // The secret thread id of the message just sent (falsy = composing).
  const [sent, setSent] = useState(null)
  const copyLink = useCopyLink()
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
    // Phase 2: every message carries a secret thread id (this browser's
    // way back if the owner replies privately) and this browser's
    // per-link sender key (what a block applies to).
    const threadId = secureId()
    const prompt = promptOf(endpoint)
    try {
      await sendAnonymousMessage(endpointId, text, {
        game: endpoint?.game || null,
        prompt,
        threadId,
        senderKey: getSenderKey(endpointId),
      })
      rememberMyThread({
        threadId,
        endpointId,
        handle: endpoint?.handle,
        text: text.trim(),
        game: endpoint?.game || null,
        prompt,
        sentAt: Date.now(),
      })
      setSent(threadId)
      setText('')
    } catch (err) {
      // The send function's messages are written for people ("You can't
      // send messages to this link." etc.).
      setError(String(err?.message || 'Could not send — try again.'))
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
            <div className="anon-message__private">
              <b>🔒 want to see if they reply?</b>
              <small>They can answer you privately. Save your private link — anyone with it can read the reply.</small>
              <div className="anon-message__private-actions">
                <Button size="sm" onClick={() => copyLink(threadLink(sent))}>
                  Copy private link
                </Button>
                <Link className="btn btn--secondary btn--sm" to={`/t/${sent}`}>
                  Open
                </Link>
              </div>
              {pushConfigured() && <NotifyMeButton threadId={sent} compact />}
            </div>
            <Button className="anon-message__send" onClick={() => setSent(null)}>
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
                  ref={textRef}
                  {...emoji.fieldProps}
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
                <EmojiToggle open={emoji.open} onToggle={emoji.toggle} className="anon-message__emoji" />
              </div>
            </div>
            <EmojiPanelSlot open={emoji.open} onPick={emoji.insert} onBackspace={emoji.backspace} />

            <p className="anon-message__note">
              🔒 anonymous q&amp;a · by sending you agree to our{' '}
              <Link to="/welcome/guidelines">community guidelines</Link>
            </p>

            {error && <p className="anon-message__error">{error}</p>}
            <Button type="submit" className="anon-message__send" loading={sending} disabled={!text.trim()}>
              {sending ? 'Sending…' : 'Send!'}
            </Button>
            <MyConversations endpointId={endpointId} handle={endpoint?.handle} />
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
