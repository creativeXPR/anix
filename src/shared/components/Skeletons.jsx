import './Skeletons.css'

// Loading placeholders (2026-10-13), each the same shape as the real thing
// it stands in for, so content swaps in without the layout jumping:
//   LinkCardSkeleton  → LinkCard (link: game band + avatar row + actions;
//                        room: avatar row + actions)
//   InboxSkeleton     → inbox filter chips + tilted message-tile grid
//   ChatSkeleton      → bubbles (room: name label over others' bubbles;
//                        private chat: "their message" card on top)
//   PageSkeleton      → a whole signed-in page (brand, heading, cards)
// All use the shared `.skel` shimmer (Skeletons.css).

export function LinkCardSkeleton({ kind = 'endpoint' }) {
  return (
    <div className="skel-card" aria-hidden="true">
      {kind === 'endpoint' && (
        <div className="skel-card__band">
          <span className="skel skel--on-band" style={{ width: 92, height: 18 }} />
        </div>
      )}
      <div className="skel-card__row">
        <span className={`skel ${kind === 'endpoint' ? 'skel--circle' : 'skel--tile'}`} style={{ width: 48, height: 48 }} />
        <span className="skel-card__lines">
          <span className="skel" style={{ width: '42%', height: 14 }} />
          <span className="skel" style={{ width: '70%', height: 11 }} />
        </span>
      </div>
      <div className="skel-card__actions">
        <span className="skel skel--pill" style={{ flex: 1, height: 36 }} />
        <span className="skel skel--circle" style={{ width: 36, height: 36 }} />
        <span className="skel skel--circle" style={{ width: 36, height: 36 }} />
      </div>
    </div>
  )
}

const TILT = ['-1.6deg', '1.4deg', '1.2deg', '-1.3deg']

export function InboxSkeleton() {
  return (
    <div className="skel-inbox" aria-busy="true" aria-label="Loading messages">
      <div className="skel-inbox__chips" aria-hidden="true">
        {[52, 92, 88, 96].map((w, i) => (
          <span key={i} className="skel skel--pill" style={{ width: w, height: 38 }} />
        ))}
      </div>
      <div className="inbox-grid" aria-hidden="true">
        {TILT.map((tilt, i) => (
          <span key={i} className="skel skel-inbox__tile" style={{ '--tilt': tilt, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </div>
  )
}

// [side, width, height] — a believable back-and-forth
const ROOM_BUBBLES = [
  ['other', 150, 42],
  ['other', 210, 42],
  ['own', 170, 42],
  ['other', 120, 42],
  ['own', 220, 64],
]
const THREAD_BUBBLES = [
  ['other', 170, 42],
  ['own', 200, 42],
  ['other', 140, 42],
]

export function ChatSkeleton({ variant = 'room' }) {
  const bubbles = variant === 'room' ? ROOM_BUBBLES : THREAD_BUBBLES
  return (
    <div className="skel-chat" aria-busy="true" aria-label="Loading messages">
      {variant === 'thread' && (
        <div className="skel-chat__original" aria-hidden="true">
          <span className="skel" style={{ width: 90, height: 10, margin: '0 auto 10px' }} />
          <div className="skel-chat__card">
            <div className="skel-card__band skel-card__band--center">
              <span className="skel skel--on-band" style={{ width: 70, height: 18 }} />
            </div>
            <div className="skel-chat__card-body">
              <span className="skel" style={{ width: '75%', height: 16 }} />
            </div>
          </div>
        </div>
      )}
      {bubbles.map(([side, width, height], i) => (
        <div key={i} className={`skel-chat__row skel-chat__row--${side}`} aria-hidden="true">
          {variant === 'room' && side === 'other' && <span className="skel" style={{ width: 56, height: 9 }} />}
          <span
            className={`skel skel-chat__bubble skel-chat__bubble--${side}`}
            style={{ width: `min(${width}px, 72%)`, height, animationDelay: `${i * 80}ms` }}
          />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="skel-page" aria-busy="true" aria-label="Loading">
      <div className="skel-page__brand" aria-hidden="true">
        <span className="skel skel--tile" style={{ width: 28, height: 28 }} />
        <span className="skel" style={{ width: 52, height: 18 }} />
      </div>
      <span className="skel" style={{ width: '62%', maxWidth: 300, height: 36 }} aria-hidden="true" />
      <span className="skel" style={{ width: '45%', maxWidth: 200, height: 11 }} aria-hidden="true" />
      <span className="skel skel-page__section" style={{ width: 110, height: 20 }} aria-hidden="true" />
      <div className="home-grid">
        <LinkCardSkeleton />
        <LinkCardSkeleton />
      </div>
    </div>
  )
}
