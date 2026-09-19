import './MessageSkeleton.css'

// Mirrors MessageBubble's row/alignment shape so the loading state reads
// as "messages are about to appear here," not just a generic spinner.
export default function MessageSkeleton({ align = 'left', width = 160 }) {
  return (
    <div className={`bubble-row${align === 'right' ? ' bubble-row--own' : ''}`}>
      <div className="message-skeleton" style={{ width }} />
    </div>
  )
}
