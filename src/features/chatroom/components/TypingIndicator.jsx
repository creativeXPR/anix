export default function TypingIndicator({ count }) {
  if (count <= 0) return null

  return (
    <p className="typing-indicator">
      {count === 1 ? 'Someone is typing…' : `${count} people are typing…`}
    </p>
  )
}
