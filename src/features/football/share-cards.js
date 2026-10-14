import { clip, DISPLAY_FONT, loadImage, roundRect, wrapText } from '../../shared/utils/message-image.js'
import { messageGradient } from '../../shared/utils/message-gradient.js'
import { matchMinute } from './matches.js'

// Story-sized share images for rooms (2026-10-14): poll results and the
// pinned match's score, in the room's colours, with a "join the room 👀"
// pill carrying the room link so people who see the status can tap in
// (or type it). Nothing on them says who shared — the owner included.
const W = 720
const H = 1280

async function canvasWithBackground(themeColor) {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const { from, to } = messageGradient(themeColor)
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H)
  bg.addColorStop(0, from)
  bg.addColorStop(1, to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  return { canvas, ctx, from, to }
}

function card(ctx, x, y, w, h) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 18
  roundRect(ctx, x, y, w, h, 40)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
}

async function footer(ctx, { link, label, color }) {
  // link pill
  const pillY = H - 205
  const pillH = 96
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 34px ${DISPLAY_FONT}`
  const pillW = Math.min(W - 80, Math.max(440, ctx.measureText(link).width + 80))
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  roundRect(ctx, (W - pillW) / 2, pillY - pillH / 2, pillW, pillH, pillH / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#6b5a7e'
  ctx.font = '600 22px Poppins, sans-serif'
  ctx.fillText(label, W / 2, pillY - 18)
  ctx.fillStyle = color
  ctx.font = `800 34px ${DISPLAY_FONT}`
  ctx.fillText(link, W / 2, pillY + 20, pillW - 40)
  // logo + wordmark
  const logo = await loadImage('/icon-512.png').catch(() => null)
  const brandY = H - 90
  ctx.font = `800 36px ${DISPLAY_FONT}`
  const wordW = ctx.measureText('anix').width
  let x = (W - ((logo ? 66 : 0) + wordW)) / 2
  if (logo) {
    ctx.save()
    roundRect(ctx, x, brandY - 26, 52, 52, 14)
    ctx.clip()
    ctx.drawImage(logo, x, brandY - 26, 52, 52)
    ctx.restore()
    x += 66
  }
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('anix', x, brandY + 2)
}

function tag(ctx, text, y) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 26px Poppins, sans-serif'
  const w = ctx.measureText(text).width + 44
  roundRect(ctx, (W - w) / 2, y - 26, w, 52, 26)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, W / 2, y + 1)
}

const toBlob = (canvas) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image'))), 'image/png'))

const displayLink = (link) => link.replace(/^https?:\/\//, '')

export async function generatePollStoryBlob({ question, options, counts, roomName, themeColor, link }) {
  const { canvas, ctx, from } = await canvasWithBackground(themeColor)
  const total = counts.reduce((a, b) => a + b, 0)
  const lead = Math.max(...counts)

  const x = 56
  const w = W - x * 2
  ctx.font = `800 44px ${DISPLAY_FONT}`
  const qLines = clip(wrapText(ctx, question, w - 80), 3)
  const rowH = 86
  const cardH = 70 + qLines.length * 52 + 26 + options.length * (rowH + 14) + 50
  const top = Math.max(150, (H - 260 - cardH) / 2 + 30)

  tag(ctx, `📊 poll · ${roomName}`, top - 60)
  card(ctx, x, top, w, cardH)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#120c16'
  ctx.font = `800 44px ${DISPLAY_FONT}`
  let y = top + 60
  for (const line of qLines) {
    ctx.fillText(line, W / 2, y)
    y += 52
  }
  y += 10

  options.forEach((option, i) => {
    const pct = total ? Math.round((counts[i] / total) * 100) : 0
    const rx = x + 34
    const rw = w - 68
    roundRect(ctx, rx, y, rw, rowH, 24)
    ctx.fillStyle = '#f3ecfb'
    ctx.fill()
    if (pct > 0) {
      ctx.save()
      roundRect(ctx, rx, y, rw, rowH, 24)
      ctx.clip()
      ctx.fillStyle = counts[i] === lead ? from : `${from}55`
      ctx.fillRect(rx, y, (rw * pct) / 100, rowH)
      ctx.restore()
    }
    const winner = total > 0 && counts[i] === lead
    ctx.textAlign = 'left'
    ctx.font = `700 32px Poppins, sans-serif`
    ctx.fillStyle = winner ? '#ffffff' : '#120c16'
    if (winner && pct < 35) ctx.fillStyle = '#120c16'
    ctx.fillText(`${winner ? '🏆 ' : ''}${option}`, rx + 26, y + rowH / 2, rw - 150)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#120c16'
    ctx.font = `800 32px ${DISPLAY_FONT}`
    ctx.fillText(`${pct}%`, rx + rw - 24, y + rowH / 2)
    y += rowH + 14
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = '#7a6f86'
  ctx.font = '600 24px Poppins, sans-serif'
  ctx.fillText(`${total} ${total === 1 ? 'vote' : 'votes'} · still open — add yours`, W / 2, y + 16)

  await footer(ctx, { link: displayLink(link), label: 'vote anonymously 👀', color: from })
  return toBlob(canvas)
}

export async function generateMatchStoryBlob({ match, roomName, themeColor, link }) {
  const { canvas, ctx, from } = await canvasWithBackground(themeColor)
  const started = ['live', 'ht', 'ft'].includes(match.status)
  const status =
    match.status === 'live' ? `LIVE ${matchMinute(match) || ''}`.trim() : match.status === 'ht' ? 'HALF TIME' : match.status === 'ft' ? 'FULL TIME' : 'KICK-OFF SOON'

  const x = 56
  const w = W - x * 2
  const cardH = 430
  const top = (H - 260 - cardH) / 2 + 20

  tag(ctx, `⚽ ${roomName}`, top - 60)
  card(ctx, x, top, w, cardH)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#7a6f86'
  ctx.font = '700 22px Poppins, sans-serif'
  ctx.fillText(match.comp.toUpperCase(), W / 2, top + 54, w - 60)

  // teams (wrapped) left and right of the score
  const teamW = 180
  const midY = top + 200
  // shrink until the longest word fits (e.g. "Saint-Germain"), max 2 lines
  const team = (name, cx) => {
    let size = 36
    const fits = () => {
      ctx.font = `800 ${size}px ${DISPLAY_FONT}`
      return name.split(/\s+/).every((word) => ctx.measureText(word).width <= teamW)
    }
    while (!fits() && size > 22) size -= 2
    ctx.fillStyle = '#120c16'
    const lines = clip(wrapText(ctx, name, teamW), 2)
    const lineH = size * 1.15
    lines.forEach((line, i) => ctx.fillText(line, cx, midY + (i - (lines.length - 1) / 2) * lineH, teamW))
  }
  team(match.home.short, x + 30 + teamW / 2)
  team(match.away.short, x + w - 30 - teamW / 2)

  roundRect(ctx, W / 2 - 92, midY - 56, 184, 112, 30)
  ctx.fillStyle = '#f3ecfb'
  ctx.fill()
  ctx.fillStyle = '#120c16'
  ctx.font = `800 68px ${DISPLAY_FONT}`
  ctx.fillText(started ? `${match.score.home ?? 0}–${match.score.away ?? 0}` : 'v', W / 2, midY + 4)

  ctx.font = '800 26px Poppins, sans-serif'
  ctx.fillStyle = match.status === 'live' ? '#16a34a' : '#7a6f86'
  ctx.fillText(`${match.status === 'live' ? '● ' : ''}${status}`, W / 2, top + 330)
  ctx.fillStyle = '#7a6f86'
  ctx.font = '600 24px Poppins, sans-serif'
  ctx.fillText('who’s winning the argument? 🗣️', W / 2, top + 378)

  await footer(ctx, { link: displayLink(link), label: 'argue about it anonymously 👀', color: from })
  return toBlob(canvas)
}
