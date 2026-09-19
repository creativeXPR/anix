// Draws a received message onto a portrait canvas card — sized for a
// WhatsApp-status-style share, the way NGL's "share as image" works.
const WIDTH = 720
const HEIGHT = 1280
const MAX_LINES = 12
const DEFAULT_ACCENT = '#ff3d7c'

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

async function draw(text, { bannerImageUrl, themeColor }) {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  const accent = themeColor || DEFAULT_ACCENT

  ctx.fillStyle = '#120a16'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const logoImg = await loadImage('/icon.jpg').catch(() => null)
  const bannerImg = bannerImageUrl ? await loadImage(bannerImageUrl).catch(() => null) : null

  let contentTop = 64

  if (bannerImg) {
    const bannerHeight = 420
    ctx.save()
    roundRect(ctx, 0, 0, WIDTH, bannerHeight, 0)
    ctx.clip()
    drawImageCover(ctx, bannerImg, 0, 0, WIDTH, bannerHeight)
    ctx.restore()

    // Fade the banner into the background so the logo/text below reads
    // clearly regardless of what's in the image.
    const gradient = ctx.createLinearGradient(0, bannerHeight - 140, 0, bannerHeight)
    gradient.addColorStop(0, 'rgba(18, 10, 22, 0)')
    gradient.addColorStop(1, 'rgba(18, 10, 22, 1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, bannerHeight - 140, WIDTH, 140)

    contentTop = bannerHeight - 64
  }

  if (logoImg) {
    ctx.save()
    roundRect(ctx, 48, contentTop, 40, 40, 12)
    ctx.clip()
    ctx.drawImage(logoImg, 48, contentTop, 40, 40)
    ctx.restore()
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = accent
  ctx.font = '600 22px Poppins, sans-serif'
  ctx.fillText('Anix', 100, contentTop + 22)

  const cardX = 48
  const cardWidth = WIDTH - 96
  const cardPaddingX = 40
  const cardPaddingY = 48
  const lineHeight = 46
  const cardTop = contentTop + 88

  ctx.font = '500 34px Poppins, sans-serif'
  const lines = wrapText(ctx, text, cardWidth - cardPaddingX * 2)
  const cardHeight = lines.length * lineHeight + cardPaddingY * 2
  const remainingSpace = HEIGHT - cardTop
  const cardY = cardTop + Math.max(0, (remainingSpace - cardHeight) / 2)

  ctx.fillStyle = '#1c1220'
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24)
  ctx.stroke()

  ctx.fillStyle = '#f6f1f8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const textCenterX = cardX + cardWidth / 2
  let lineY = cardY + cardPaddingY + lineHeight / 2
  for (const line of lines) {
    ctx.fillText(line, textCenterX, lineY)
    lineY += lineHeight
  }

  return canvas
}

export async function generateMessageImageBlob(text, { bannerImageUrl, themeColor } = {}) {
  const canvas = await draw(text, { bannerImageUrl, themeColor })

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
      return generateMessageImageBlob(text, { themeColor })
    }
    throw err
  }
}
