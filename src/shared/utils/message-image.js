
// Draws a received message onto a portrait canvas card — sized for a
// WhatsApp-status / story share, the way NGL's "share as image" works:
// the same game-header/white-body card MessageCard renders in the app,
// on a full-bleed gradient, optionally with the owner's answer below.
const WIDTH = 720
const HEIGHT = 1280
const MAX_LINES = 12
const DISPLAY_FONT = "'Bricolage Grotesque', Poppins, sans-serif"

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  if (lines.length > MAX_LINES) {
    const clamped = lines.slice(0, MAX_LINES)
    clamped[MAX_LINES - 1] = `${clamped[MAX_LINES - 1].replace(/\s*\S*$/, '')}…`
    return clamped
  }
  return lines
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// CSS object-fit:cover, for drawing a banner into a fixed-size rect
// without distorting its aspect ratio.
function drawImageCover(ctx, img, x, y, width, height) {
  const imgRatio = img.width / img.height
  const rectRatio = width / height
  let sx, sy, sw, sh

  if (imgRatio > rectRatio) {
    sh = img.height
    sw = sh * rectRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / rectRatio
    sx = 0
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height)
}

async function draw({ text, header, colors, answer, bannerImageUrl }) {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  const [from, to] = colors

  // Full-bleed gradient story background in the game's colors, like
  // NGL's share image.
  const background = ctx.createLinearGradient(0, 0, WIDTH * 0.4, HEIGHT)
  background.addColorStop(0, from)
  background.addColorStop(1, to)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const logoImg = await loadImage('/icon-512.png').catch(() => null)
  const bannerImg = bannerImageUrl ? await loadImage(bannerImageUrl).catch(() => null) : null

  // Measure everything first so the whole group (avatar + card + answer)
  // can be centered vertically as one unit.
  const cardX = 56
  const cardWidth = WIDTH - cardX * 2
  const radius = 40
  const bodyPaddingX = 44
  const bodyPaddingY = answer ? 48 : 64
  const lineHeight = answer ? 48 : 54
  const bodyFont = answer ? '700 36px Poppins, sans-serif' : '700 42px Poppins, sans-serif'

  ctx.font = `800 36px ${DISPLAY_FONT}`
  const headerLines = wrapText(ctx, header, cardWidth - 80).slice(0, 2)
  const headerHeight = headerLines.length * 42 + 60

  ctx.font = bodyFont
  const lines = wrapText(ctx, text, cardWidth - bodyPaddingX * 2).slice(0, answer ? 7 : MAX_LINES)
  const bodyHeight = lines.length * lineHeight + bodyPaddingY * 2
  const cardHeight = headerHeight + bodyHeight

  ctx.font = `800 52px ${DISPLAY_FONT}`
  const answerLines = answer ? wrapText(ctx, answer, WIDTH - 120).slice(0, 5) : []
  const answerHeight = answerLines.length ? 56 + answerLines.length * 60 : 0

  const avatarSize = bannerImg ? 120 : 0
  const avatarGap = bannerImg ? 32 : 0
  const groupHeight = avatarSize + avatarGap + cardHeight + answerHeight
  const groupTop = Math.max(70, (HEIGHT - 130 - groupHeight) / 2)

  if (bannerImg) {
    const avatarX = (WIDTH - avatarSize) / 2
    ctx.save()
    roundRect(ctx, avatarX - 6, groupTop - 6, avatarSize + 12, avatarSize + 12, 38)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    roundRect(ctx, avatarX, groupTop, avatarSize, avatarSize, 32)
    ctx.clip()
    drawImageCover(ctx, bannerImg, avatarX, groupTop, avatarSize, avatarSize)
    ctx.restore()
  }

  const cardY = groupTop + avatarSize + avatarGap

  // Soft drop shadow under the card.
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 18
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Header band: the game's gradient, clipped to the card's rounded top.
  ctx.save()
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius)
  ctx.clip()
  const band = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + headerHeight)
  band.addColorStop(0, from)
  band.addColorStop(1, to)
  ctx.fillStyle = band
  ctx.fillRect(cardX, cardY, cardWidth, headerHeight)
  ctx.restore()

  const centerX = WIDTH / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#ffffff'
  ctx.font = `800 36px ${DISPLAY_FONT}`
  let headerY = cardY + 30 + 21
  for (const line of headerLines) {
    ctx.fillText(line, centerX, headerY)
    headerY += 42
  }

  ctx.fillStyle = '#111111'
  ctx.font = bodyFont
  let lineY = cardY + headerHeight + bodyPaddingY + lineHeight / 2
  for (const line of lines) {
    ctx.fillText(line, centerX, lineY)
    lineY += lineHeight
  }

  // The owner's answer, big and white under the card (answer & share).
  if (answerLines.length) {
    ctx.fillStyle = '#ffffff'
    let answerY = cardY + cardHeight + 44
    ctx.font = '600 24px Poppins, sans-serif'
    ctx.globalAlpha = 0.85
    ctx.fillText('anonymous asked ✦ i answered', centerX, answerY)
    ctx.globalAlpha = 1
    answerY += 56
    ctx.font = `800 52px ${DISPLAY_FONT}`
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
    ctx.shadowBlur = 12
    for (const line of answerLines) {
      ctx.fillText(line, centerX, answerY)
      answerY += 60
    }
    ctx.shadowBlur = 0
  }

  // Branding at the bottom: logo + wordmark.
  const brandY = HEIGHT - 90
  ctx.font = `800 36px ${DISPLAY_FONT}`
  const wordWidth = ctx.measureText('anix').width
  const logoSize = 52
  const brandWidth = (logoImg ? logoSize + 14 : 0) + wordWidth
  let brandX = (WIDTH - brandWidth) / 2
  if (logoImg) {
    ctx.save()
    roundRect(ctx, brandX, brandY - logoSize / 2, logoSize, logoSize, 14)
    ctx.clip()
    ctx.drawImage(logoImg, brandX, brandY - logoSize / 2, logoSize, logoSize)
    ctx.restore()
    brandX += logoSize + 14
  }
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('anix', brandX, brandY + 2)

  return canvas
}

// Story-sized PNG of a received message. `header`/`colors` come from the
// message's game (see games.js headerOf/gameOf); `answer` (optional) adds
// the owner's reply under the card.
export async function generateMessageImageBlob({ text, header, colors, answer, bannerImageUrl }) {
  const canvas = await draw({ text, header, colors, answer, bannerImageUrl })

  try {
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
    })
  } catch (err) {
    // A cross-origin banner without permissive CORS taints the canvas —
    // toBlob() throws SecurityError. Redraw without it rather than
    // failing the whole share-image feature over one missing header.
    if (bannerImageUrl) {
      console.warn('Banner image blocked canvas export, retrying without it:', err)
      return generateMessageImageBlob({ text, header, colors, answer })
    }
    throw err
  }
}
