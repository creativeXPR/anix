import { useState } from 'react'
import Button from '../../shared/components/Button.jsx'
import Sheet from '../../shared/components/Sheet.jsx'
import { useToast } from '../../shared/toast-store.js'
import {
  createPoll,
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
  POLL_TEMPLATES,
  pollCooldownLeft,
} from './polls.js'
import './football.css'

// Start a poll: quick football templates or your own. Posted without a
// sender — nobody can tell who started it.
export default function PollComposer({ roomId, onClose }) {
  const showToast = useToast()
  const [template, setTemplate] = useState('winner')
  const [question, setQuestion] = useState(POLL_TEMPLATES[0].question)
  const [options, setOptions] = useState(POLL_TEMPLATES[0].options)
  const [sending, setSending] = useState(false)

  function pick(t) {
    setTemplate(t.key)
    setQuestion(t.question)
    setOptions(t.options)
  }

  const filled = options.filter((o) => o.trim()).length
  const ready = question.trim() && filled >= POLL_MIN_OPTIONS

  async function submit(event) {
    event.preventDefault()
    const wait = pollCooldownLeft(roomId)
    if (wait) {
      showToast(`One poll a minute — try again in ${Math.ceil(wait / 1000)}s`, 'error')
      return
    }
    setSending(true)
    try {
      await createPoll(roomId, question, options)
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not post the poll', 'error')
      setSending(false)
    }
  }

  return (
    <Sheet as="form" onClose={onClose} onSubmit={submit}>
      <h2>new poll</h2>
      <p className="identity__intro">posted anonymously — nobody sees who started it.</p>

      <div className="poll-templates" role="radiogroup" aria-label="Poll type">
        {POLL_TEMPLATES.map((t) => (
          <button key={t.key} type="button" className="chip" role="radio" aria-checked={template === t.key} aria-selected={template === t.key} onClick={() => pick(t)}>
            {t.label}
          </button>
        ))}
      </div>

      <input
        className="field"
        value={question}
        onChange={(e) => setQuestion(e.target.value.slice(0, POLL_QUESTION_MAX))}
        placeholder="ask something…"
        aria-label="Question"
        required
      />

      <div className="poll-options-edit">
        {options.map((option, i) => (
          <div key={i} className="poll-options-edit__row">
            <input
              className="field"
              value={option}
              onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value.slice(0, POLL_OPTION_MAX) : o)))}
              placeholder={template === 'winner' ? (i === 0 ? 'home team' : i === 2 ? 'away team' : `option ${i + 1}`) : `option ${i + 1}`}
              aria-label={`Option ${i + 1}`}
            />
            {options.length > POLL_MIN_OPTIONS && (
              <button type="button" className="icon-btn" onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label={`Remove option ${i + 1}`}>
                ✕
              </button>
            )}
          </div>
        ))}
        {options.length < POLL_MAX_OPTIONS && (
          <button type="button" className="poll-options-edit__add" onClick={() => setOptions([...options, ''])}>
            + add option
          </button>
        )}
      </div>

      <Button type="submit" block loading={sending} disabled={!ready}>
        Post poll
      </Button>
    </Sheet>
  )
}
