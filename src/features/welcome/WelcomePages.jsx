import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_TOPICS, sendContactMessage } from './contact.js'
import { InnerPage } from './WelcomeLayout.jsx'

function Tile({ emoji, title, children }) {
  return (
    <div className="wl-tile">
      <span aria-hidden="true">{emoji}</span>
      <b>{title}</b>
      <p>{children}</p>
    </div>
  )
}

export function AboutPage() {
  return (
    <InnerPage
      title="About"
      kicker="About"
      heading="say it. anonymously."
      lead="Anix is where people say the things they wouldn't say with their name on it — the sweet, the funny and the brutally honest."
    >
      <div className="wl-tiles">
        <Tile emoji="💌" title="anonymous messages">Your own link with a game or custom prompt. Messages arrive sealed until you open them.</Tile>
        <Tile emoji="🍿" title="anonymous rooms">Group chats where everyone is a random guest. You control when they&apos;re open.</Tile>
        <Tile emoji="👻" title="private replies">Answer someone privately and keep talking — still anonymous on their side.</Tile>
      </div>
      <h2>why we built it</h2>
      <p>
        Honest feedback is rare and compliments are rarer. Anonymity makes both easier — as long as it comes with real
        controls for the person on the receiving end. Anix is built around that balance: playful on the outside, careful
        underneath.
      </p>
      <h2>who makes it</h2>
      <p>
        Anix is made by IARdays x creativeXPR. Questions, ideas or bugs? <Link to="/welcome/contact">Contact us</Link>.
      </p>
    </InnerPage>
  )
}

export function SafetyPage() {
  return (
    <InnerPage
      title="Safety"
      kicker="Safety"
      heading="anonymous, not lawless."
      lead="Anonymity is the fun part. Being safe is the part we don't compromise on."
    >
      <h2>what stays anonymous</h2>
      <ul>
        <li>When someone sends you a message, you never see their name, account or contact details — senders don&apos;t need an account at all.</li>
        <li>In rooms, everyone appears as a random guest name that&apos;s different in every room.</li>
        <li>In private replies, the sender stays anonymous to you for the whole conversation.</li>
      </ul>
      <h2>your controls</h2>
      <div className="wl-tiles">
        <Tile emoji="🛡️" title="automatic filtering">Every anonymous message and private reply is checked before it reaches you. Offensive ones go to a separate &quot;filtered&quot; folder you never have to open.</Tile>
        <Tile emoji="⛔" title="block">Stop a sender&apos;s browser from messaging your link again.</Tile>
        <Tile emoji="✋" title="end a chat">Close a private conversation so neither side can send more.</Tile>
        <Tile emoji="🗑️" title="delete">Delete any message you receive, or a whole link or room with everything in it.</Tile>
        <Tile emoji="🔒" title="open / close rooms">Rooms start closed. Open them when you&apos;re ready, close them anytime.</Tile>
        <Tile emoji="🚩" title="report">Report a message, a private chat or a room message — our team reviews reports.</Tile>
        <Tile emoji="⏳" title="auto-expiry">Rooms disappear after two days without new messages.</Tile>
      </div>
      <h2>the rules</h2>
      <p>
        Everyone on Anix agrees to our <Link to="/welcome/guidelines">Community Guidelines</Link> — read them, they&apos;re
        short.
      </p>
      <h2>anonymous isn&apos;t untraceable</h2>
      <p>
        We don&apos;t show identities to users, but threats, harassment, hate, sexual content involving minors, or anything
        illegal isn&apos;t protected by anonymity. Like any website, our servers keep short-lived technical logs
        (including IP addresses, for 30 days — see our <Link to="/welcome/privacy">Privacy Policy</Link>). We act on
        reports and may cooperate with law enforcement where the law requires it.
      </p>
      <h2>tips</h2>
      <ul>
        <li>Only share your link where you&apos;re comfortable getting messages from anyone who sees it.</li>
        <li>Blocking is per browser — if someone keeps coming back, delete the link and make a new one.</li>
        <li>
          If something makes you feel unsafe, talk to someone you trust — and tell us through{' '}
          <Link to="/welcome/contact">Contact us</Link> (choose &quot;safety report&quot;).
        </li>
      </ul>
    </InnerPage>
  )
}

export function ContactPage() {
  const [topic, setTopic] = useState(CONTACT_TOPICS[0])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      await sendContactMessage({ topic, email, message })
      setSent(true)
    } catch {
      setError('Could not send — please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <InnerPage
      title="Contact"
      kicker="Contact"
      heading="talk to us"
      lead="Questions, ideas, bugs or something that needs our attention — send it here and it lands with the Anix team."
    >
      <div className="wl-card">
        {sent ? (
          <div className="wl-sent">
            <div aria-hidden="true">💜</div>
            <h2>thank you!</h2>
            <p>We got your message and read every single one.</p>
          </div>
        ) : (
          <form className="wl-form" onSubmit={handleSubmit}>
            <div>
              <span className="wl-form__label">what&apos;s it about?</span>
              <div className="wl-topics" role="radiogroup" aria-label="Topic">
                {CONTACT_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={topic === t}
                    className="wl-topic"
                    onClick={() => setTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="wl-form__label">
              your email <small>optional — only if you want a reply</small>
              <input
                className="field"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={200}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="wl-form__label">
              message
              <textarea
                className="field"
                required
                maxLength={4000}
                placeholder="tell us everything…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="wl-pill wl-pill--solid" disabled={sending || !message.trim()}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </InnerPage>
  )
}

const UPDATED = 'October 12, 2026'

export function TermsPage() {
  return (
    <InnerPage title="Terms of Service" kicker="Terms of Service" heading="terms of service" lead={`Last updated ${UPDATED}`}>
      <h2>1. using anix</h2>
      <p>
        Anix lets you create anonymous-message links and anonymous chat rooms, and lets anyone with a link send messages
        or join a room. By using Anix you agree to these terms. You must be at least 13 years old, or older if your
        country requires it.
      </p>
      <h2>2. your account</h2>
      <p>
        Creating links and rooms needs an account (email and password or Google). You&apos;re responsible for what happens
        under your account and for keeping your password safe. People sending you messages don&apos;t need an account.
      </p>
      <h2>3. what you may not do</h2>
      <p>
        Follow our <Link to="/welcome/guidelines">Community Guidelines</Link>. In particular, don&apos;t:
      </p>
      <ul>
        <li>Harass, bully, threaten or intimidate anyone, or encourage self-harm.</li>
        <li>Post hate speech, sexual content involving minors, non-consensual intimate content, or anything illegal.</li>
        <li>Share someone&apos;s private information, or impersonate someone.</li>
        <li>Spam, scrape, overload, or try to break or bypass Anix&apos;s security, blocks or limits.</li>
      </ul>
      <h2>4. your content</h2>
      <p>
        You own what you write. You give Anix permission to store, display and deliver it so the service works (for
        example, showing a message to the link owner, or rendering a share image you ask for).
      </p>
      <h2>5. anonymity, moderation and enforcement</h2>
      <p>
        We don&apos;t show senders&apos; identities to other users. Anonymous messages and private replies are checked
        by an automated moderation system before delivery; messages it flags are kept out of the inbox (the recipient
        can still choose to view them) and may be reviewed by us. Automated checks aren&apos;t perfect, so please report
        anything that gets through. We may remove content, block senders, close rooms or suspend accounts that break
        these terms, and we may preserve or disclose information where the law requires it.
      </p>
      <h2>6. rooms and data that expire</h2>
      <p>
        Rooms are deleted after two days without new messages, together with their messages and images. You can delete
        your messages, links and rooms at any time.
      </p>
      <h2>7. the service</h2>
      <p>
        Anix is provided &quot;as is&quot;. We work to keep it running and safe, but we can&apos;t promise it will always be
        available or error-free, and we may change or stop features.
      </p>
      <h2>8. changes</h2>
      <p>We&apos;ll update this page when the terms change. Continuing to use Anix after a change means you accept the new terms.</p>
      <h2>9. contact</h2>
      <p>
        Questions about these terms? <Link to="/welcome/contact">Contact us</Link>.
      </p>
    </InnerPage>
  )
}

export function PrivacyPage() {
  return (
    <InnerPage title="Privacy Policy" kicker="Privacy Policy" heading="privacy policy" lead={`Last updated ${UPDATED}`}>
      <h2>the short version</h2>
      <ul>
        <li>Senders don&apos;t need an account, and we never show who sent a message.</li>
        <li>We store only what Anix needs to work, and we don&apos;t sell your data or show ads.</li>
        <li>You can delete your messages, links and rooms whenever you want.</li>
      </ul>
      <h2>what we store</h2>
      <h3>if you have an account</h3>
      <ul>
        <li><b>Account:</b> your email address and sign-in details (handled by Firebase Authentication).</li>
        <li><b>Your links and rooms:</b> their names, game or custom prompt, color, open/closed status, and any photo you upload.</li>
        <li><b>Messages you receive:</b> their text, the prompt they answered, when they arrived, whether you opened them, and any answer you save.</li>
        <li><b>Notifications:</b> if you turn them on, a push token for your device.</li>
        <li><b>Feedback, contact messages and reports</b> you send us.</li>
      </ul>
      <h3>if you send a message or join a room</h3>
      <ul>
        <li>The message text and when it was sent.</li>
        <li>
          Two random codes created by your browser: one so the owner can reply to you privately, and one so a block can
          apply to your browser. They aren&apos;t linked to your name, email or account.
        </li>
        <li>In rooms: a random guest name, your messages and images, and short-lived &quot;typing&quot;/&quot;here now&quot; signals.</li>
        <li>If you ask to be notified of a reply, a push token for your device — only our servers can read it.</li>
      </ul>
      <h3>stored on your device</h3>
      <p>
        Your browser remembers your theme, sound setting, the conversations you started and your random codes, so things
        keep working when you come back. Clearing your browser data removes them.
      </p>
      <h2>automatic moderation</h2>
      <p>
        Before an anonymous message or private reply is delivered, its text is sent to Google Cloud&apos;s content
        moderation service, which scores it for things like insults, threats or sexual content. We store the result
        with the message. Messages that look harmful are hidden from the inbox (the recipient can choose to view them)
        and may be read by our team for review, as can reported content.
      </p>
      <h2>technical logs</h2>
      <p>
        When you send an anonymous message or a private reply, our hosting provider (Google Cloud) automatically records
        a technical log of the request: your IP address, your browser and device type, and the time. These logs are kept
        for 30 days and then deleted. They aren&apos;t shown to anyone on Anix and aren&apos;t attached to your message;
        we use them only to keep the service secure, to investigate serious abuse, and to respond to valid legal
        requests.
      </p>
      <h2>visitor counts</h2>
      <p>
        To know how many people use Anix, your browser keeps a random ID that isn&apos;t linked to your account, name or
        IP address, and records one &quot;visited today&quot; mark per day. We only ever look at the totals.
      </p>
      <h2>how long we keep it</h2>
      <ul>
        <li>Rooms and everything in them are deleted after two days without new messages.</li>
        <li>Messages, links and private conversations stay until you delete them; deleting a link deletes its messages and conversations.</li>
      </ul>
      <h2>who we share it with</h2>
      <p>
        Anix runs on Google Firebase (database, file storage, sign-in, hosting, cloud functions and push notifications),
        which processes data on our behalf. We don&apos;t sell data or use advertising trackers. We may disclose information
        where the law requires it.
      </p>
      <h2>your choices</h2>
      <ul>
        <li>Delete any message, link or room from inside the app.</li>
        <li>Turn notifications and sounds off in your profile.</li>
        <li>
          To delete your account or ask about your data, <Link to="/welcome/contact">contact us</Link>.
        </li>
      </ul>
      <h2>children</h2>
      <p>Anix isn&apos;t for children under 13 (or the minimum age in your country).</p>
      <h2>changes</h2>
      <p>We&apos;ll update this page when anything changes and change the date at the top.</p>
    </InnerPage>
  )
}

export function GuidelinesPage() {
  return (
    <InnerPage
      title="Community Guidelines"
      kicker="Community Guidelines"
      heading="be anonymous. be decent."
      lead="Anix is for honest, funny and kind things people wouldn't say with their name on it — not for hurting anyone. These apply to messages, private replies, rooms, link names and photos."
    >
      <h2>not allowed</h2>
      <div className="wl-tiles">
        <Tile emoji="🚫" title="bullying & harassment">Insults, humiliation, targeting someone again and again, or getting others to pile on.</Tile>
        <Tile emoji="⚠️" title="threats & violence">Threatening anyone, encouraging violence, or celebrating it.</Tile>
        <Tile emoji="🛑" title="hate">Attacking people for who they are — race, ethnicity, religion, gender, sexuality, disability and more.</Tile>
        <Tile emoji="🔞" title="sexual content">No sexual messages or images — and never anything sexual involving minors.</Tile>
        <Tile emoji="💔" title="self-harm">No encouraging self-harm or suicide. If someone seems at risk, report it.</Tile>
        <Tile emoji="🕵️" title="private info">No sharing someone&apos;s address, number, photos or secrets without consent, and no impersonating anyone.</Tile>
        <Tile emoji="📢" title="spam & scams">No spam, scams, or links meant to trick people.</Tile>
        <Tile emoji="⚖️" title="anything illegal">If it&apos;s illegal where you or they live, it&apos;s not okay here.</Tile>
      </div>
      <h2>what happens if you break them</h2>
      <ul>
        <li>Our automatic filter keeps many harmful messages out of inboxes before anyone sees them.</li>
        <li>People can block you, end conversations with you, and report you to our team.</li>
        <li>We may delete content, block your browser from a link, close rooms or suspend accounts.</li>
        <li>Anonymous isn&apos;t untraceable: we may preserve or share information where the law requires it.</li>
      </ul>
      <h2>if something&apos;s wrong</h2>
      <p>
        Use <b>Report</b> on the message or chat, block the sender, and see <Link to="/welcome/safety">Safety</Link> for
        your other controls. If you&apos;re in danger, contact local emergency services first.
      </p>
    </InnerPage>
  )
}
