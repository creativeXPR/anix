import { useCallback, useRef, useState } from 'react'

// Wires a text field to the emoji panel, WhatsApp-style:
//  - opening the panel hides the phone keyboard (blurs the field) and
//    remembers the cursor; tapping the field again swaps back to the
//    keyboard (closes the panel)
//  - picking inserts at the remembered cursor; ⌫ deletes one whole emoji/
//    character (grapheme), not half a surrogate pair
//  - on desktop (fine pointer) focus stays in the field the whole time
const touchy = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return Array.from(text)
}

export function useEmojiInput({ inputRef, value, setValue, maxLength }) {
  const [open, setOpen] = useState(false)
  const caret = useRef(null) // { start, end } while the panel has the floor

  const remember = () => {
    const el = inputRef.current
    caret.current = el ? { start: el.selectionStart ?? value.length, end: el.selectionEnd ?? value.length } : null
  }

  const placeCaret = (pos) => {
    caret.current = { start: pos, end: pos }
    if (touchy()) return
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const toggle = () => {
    if (open) {
      setOpen(false)
      inputRef.current?.focus() // back to the keyboard
      return
    }
    remember()
    if (touchy()) inputRef.current?.blur()
    setOpen(true)
  }

  const close = useCallback(() => setOpen(false), [])

  const insert = (emoji) => {
    const { start = value.length, end = value.length } = caret.current || {}
    const next = value.slice(0, start) + emoji + value.slice(end)
    if (maxLength && next.length > maxLength) return
    setValue(next)
    placeCaret(start + emoji.length)
  }

  const backspace = () => {
    const { start = value.length, end = value.length } = caret.current || {}
    if (start !== end) {
      setValue(value.slice(0, start) + value.slice(end))
      placeCaret(start)
      return
    }
    if (start === 0) return
    const before = graphemes(value.slice(0, start))
    const removed = before.pop() || ''
    setValue(before.join('') + value.slice(start))
    placeCaret(start - removed.length)
  }

  // Tapping the field while the panel is open = "show me the keyboard".
  const onFieldFocus = () => {
    if (open && touchy()) setOpen(false)
  }
  const onFieldSelect = () => {
    if (!open) return
    remember()
  }

  return { open, toggle, close, insert, backspace, fieldProps: { onFocus: onFieldFocus, onSelect: onFieldSelect } }
}
