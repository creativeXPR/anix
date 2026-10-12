import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../../shared/games.js'
import { useInstall } from '../../shared/install-store.js'
import { useCursorPhysics } from './use-cursor-physics.js'
import { usePageTitle } from './use-page-title.js'
import { WelcomeFooter, WelcomeHeader } from './WelcomeLayout.jsx'

const APP_URL = 'https://anix.web.app'
// Prompts for the top ticker — the real games plus an example custom one.
const PROMPTS = [...Object.values(GAMES).map((g) => g.prompt).filter(Boolean), 'rate my new hair 💇']

const gradient = (key) => ({ '--g1': GAMES[key].colors[0], '--g2': GAMES[key].colors[1] })

function GameTitle({ game }) {
  return <span className={`wl-gtitle${GAMES[game].loud ? ' wl-gtitle--loud' : ''}`}>{GAMES[game].title}</span>
}

function GameCard({ game, text, className = '', style }) {
  return (
    <div className={`wl-gcard ${className}`.trim()} style={{ ...gradient(game), ...style }}>
      <div className="wl-gcard__head">
        <GameTitle game={game} />
      </div>
      <div className="wl-gcard__body">{text}</div>
    </div>
  )
}

function Emoji({ children, style }) {
  return (
    <span className="wl-float wl-emoji wl-phys" style={style} aria-hidden="true">
      {children}
    </span>
  )
}

export default function WelcomeHome() {
  usePageTitle('Anix — say it. anonymously.')
  const rootRef = useRef(null)
  const { canInstall, promptInstall } = useInstall()
  const [qr, setQr] = useState(null)
  useCursorPhysics(rootRef)

  useEffect(() => {
    QRCode.toDataURL(APP_URL, { errorCorrectionLevel: 'H', margin: 0, width: 512, color: { dark: '#111111', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [])

  const ticker = [...PROMPTS, ...PROMPTS]

  return (
    <div className="wl" ref={rootRef}>
      <div className="wl-marquee" aria-hidden="true">
        <div className="wl-marquee__track">
          {ticker.map((prompt, i) => (
            <span key={i}>{prompt}</span>
          ))}
        </div>
      </div>

      <div className="wl-site">
        <WelcomeHeader />

        <section className="wl-hero">
          <Emoji style={{ left: '8%', top: '12%', '--r': '-12deg' }}>👋</Emoji>
          <Emoji style={{ right: '9%', top: '9%', '--r': '10deg', animationDelay: '.7s' }}>💌</Emoji>
          <Emoji style={{ left: '4%', bottom: '16%', '--r': '8deg', animationDelay: '1.2s' }}>👀</Emoji>
          <span className="wl-float wl-emoji wl-phys wl-hero__fire" style={{ right: '3%', top: '57%', '--r': '-10deg', animationDelay: '.4s' }} aria-hidden="true">
            🔥
          </span>

          <div className="wl-mock wl-float wl-phys wl-hero__mock" style={{ left: 'max(2%, calc(50% - 600px))', bottom: '9%', '--r': '-8deg', animationDelay: '.3s' }} aria-hidden="true">
            <div className="wl-mock__head">
              <img src="/icon.svg" alt="" />
              <div>
                <small>@hello</small>
                <b>{GAMES.tbh.prompt}</b>
              </div>
            </div>
            <p className="wl-mock__body">
              tbh you give the best advice<span className="wl-mock__dice">🎲</span>
            </p>
            <p className="wl-mock__send">Send!</p>
          </div>
          <div className="wl-float wl-phys wl-hero__mock" style={{ right: 'max(2%, calc(50% - 600px))', bottom: '12%', '--r': '7deg', animationDelay: '1s' }} aria-hidden="true">
            <GameCard game="tbh" text="i love your laugh haha" />
          </div>

          <h1>
            say it.
            <br />
            anonymously.
          </h1>
          <p>Anonymous messages, games and chat rooms — share your link and find out what people really think.</p>
          <div className="wl-hero__ctas">
            <Link className="wl-pill wl-pill--white wl-pill--big" to="/auth">
              Get started
            </Link>
            {canInstall && (
              <button type="button" className="wl-pill wl-pill--ink wl-pill--big" onClick={promptInstall}>
                Install app
              </button>
            )}
          </div>
          <div className="wl-scrollcue">
            <span>↓</span> scroll for more
          </div>
        </section>

        <section className="wl-scatter" aria-label="Example messages">
          <img className="wl-scatter__ghost wl-phys" src="/icon.svg" alt="" />
          <GameCard game="deal" text="they don't like marvel movies" className="wl-phys" style={{ left: '38%', top: '2%', '--r': '5deg' }} />
          <GameCard game="cancelled" text="'the office' is so overrated" className="wl-phys" style={{ left: '8%', top: '22%', '--r': '-3deg' }} />
          <GameCard game="tbh" text="i love your laugh haha" className="wl-phys" style={{ right: '9%', top: '24%', '--r': '-12deg' }} />
          <GameCard game="nhie" text="facetuned my social media pics" className="wl-phys" style={{ left: '16%', bottom: '6%', '--r': '-9deg' }} />
          <GameCard game="words" text="smart, funny, lit" className="wl-phys" style={{ right: '14%', bottom: '2%', '--r': '3deg' }} />
          <GameCard game="confess" text="i still have your hoodie" className="wl-phys" style={{ left: '42%', bottom: '-2%', '--r': '-4deg' }} />
        </section>

        <section className="wl-sec">
          <div className="wl-sec__head">
            <h2>how it works</h2>
            <p>Three steps. No names, ever.</p>
          </div>
          <div className="wl-steps">
            <div className="wl-step">
              <span className="wl-step__n">1</span>
              <div className="wl-step__em">🔗</div>
              <h3>make your link</h3>
              <p>Pick a game — tbh, 3 words, never have I ever — or write your own prompt.</p>
            </div>
            <div className="wl-step">
              <span className="wl-step__n">2</span>
              <div className="wl-step__em">📲</div>
              <h3>drop it in your story</h3>
              <p>Friends tap it and send you something anonymously. The 🎲 gives them ideas.</p>
            </div>
            <div className="wl-step">
              <span className="wl-step__n">3</span>
              <div className="wl-step__em">💌</div>
              <h3>open &amp; answer</h3>
              <p>Messages arrive sealed. Tap to reveal, answer, and share your reply as a story image.</p>
            </div>
          </div>
        </section>

        <section className="wl-sec">
          <div className="wl-sec__head">
            <h2>
              more than
              <br />a link
            </h2>
            <p>The stuff you won&apos;t find anywhere else.</p>
          </div>
          <div className="wl-spots">
            <div className="wl-spot">
              <div className="wl-spot__copy">
                <span className="wl-spot__tag">chat rooms</span>
                <h3>anonymous group chats</h3>
                <p>Open a room, share the link, and everyone talks as a random guest. Rooms close when you say and vanish after two quiet days.</p>
              </div>
              <div className="wl-spot__mock">
                <div className="wl-chatmock" style={{ '--r': '3deg' }}>
                  <div className="wl-chatmock__top">
                    <span>🍿</span>
                    <div>
                      <b>movie night</b>
                      <small>6 people here · anonymous</small>
                    </div>
                  </div>
                  <div className="wl-chatmock__body">
                    <div className="wl-who">Guest K7Q2XA</div>
                    <div className="wl-b wl-b--o">ok who picked this movie 😭</div>
                    <div className="wl-b wl-b--m">it was a group vote!!</div>
                    <div className="wl-who" style={{ color: '#16a3b8' }}>
                      Guest 9MPXTR
                    </div>
                    <div className="wl-b wl-b--o">the soundtrack slaps tho</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wl-spot">
              <div className="wl-spot__copy">
                <span className="wl-spot__tag">private replies</span>
                <h3>reply without revealing anyone</h3>
                <p>Answer a message privately and keep talking — they stay anonymous, you just get the conversation. Block or end it anytime.</p>
              </div>
              <div className="wl-spot__mock">
                <div className="wl-chatmock" style={{ '--r': '-3deg' }}>
                  <div className="wl-chatmock__top">
                    <span>👻</span>
                    <div>
                      <b>anonymous</b>
                      <small>private chat on @hello</small>
                    </div>
                  </div>
                  <div className="wl-chatmock__body">
                    <div className="wl-b wl-b--o">tbh i love your laugh haha</div>
                    <div className="wl-b wl-b--m">omg thank you 😭 who is this??</div>
                    <div className="wl-b wl-b--o">not telling 🤫 but we have a class together</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wl-spot">
              <div className="wl-spot__copy">
                <span className="wl-spot__tag">make it yours</span>
                <h3>games, prompts &amp; vibes</h3>
                <p>Seven games or your own custom prompt, five color vibes, your own photo, and a dice that never runs out of ideas.</p>
              </div>
              <div className="wl-spot__mock">
                <div className="wl-chips">
                  {Object.keys(GAMES)
                    .filter((key) => key !== 'custom')
                    .map((key) => (
                      <span key={key} className="wl-chip" style={gradient(key)}>
                        <GameTitle game={key} />
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wl-sec">
          <div className="wl-safety">
            <div>
              <div className="wl-safety__em">🛡️</div>
              <h2>anonymous, not lawless.</h2>
            </div>
            <div>
              <ul>
                <li>
                  <span>🚩</span>
                  <div>
                    <b>Report</b> anything harmful in a room — it goes straight to our team.
                  </div>
                </li>
                <li>
                  <span>⛔</span>
                  <div>
                    <b>Block</b> a sender from your link, or <b>end</b> a private chat in one tap.
                  </div>
                </li>
                <li>
                  <span>🔒</span>
                  <div>
                    <b>You decide</b> when rooms are open; they close by default and vanish after two quiet days.
                  </div>
                </li>
              </ul>
              <Link className="wl-pill wl-pill--ink" to="/welcome/safety">
                How we keep it safe →
              </Link>
            </div>
          </div>
        </section>

        <section className="wl-sec wl-join">
          <Emoji style={{ left: '10%', top: '16%', '--r': '-8deg' }}>🫧</Emoji>
          <Emoji style={{ right: '12%', top: '12%', '--r': '12deg', animationDelay: '.6s' }}>👑</Emoji>
          <Emoji style={{ left: '14%', bottom: '18%', '--r': '10deg', animationDelay: '1.1s' }}>🎲</Emoji>
          <Emoji style={{ right: '10%', bottom: '22%', '--r': '-6deg', animationDelay: '.3s' }}>👋</Emoji>
          <h2>join the fun</h2>
          <div className="wl-qr">
            {qr && <img className="wl-qr__code" src={qr} alt={`QR code that opens ${APP_URL}`} />}
            <img className="wl-qr__logo" src="/icon.svg" alt="" />
          </div>
          <Link className="wl-pill wl-pill--white wl-pill--big" to="/auth">
            Get started
          </Link>
          <small>scan to open Anix on your phone</small>
        </section>
      </div>

      <WelcomeFooter />
    </div>
  )
}
