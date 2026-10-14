// Native share sheet with the image + link text where supported (phones),
// else copy the image (with the link as its text form) to the clipboard,
// else download it. The link is also copied on its own first — story apps
// (Instagram, Snapchat) ignore shared text, so it's ready to paste as a
// link sticker.
export async function shareImage(blob, { link, text, filename = 'anix.png' }, showToast) {
  const file = new File([blob], filename, { type: 'image/png' })
  const copyLink = navigator.clipboard?.writeText(link).then(
    () => true,
    () => false,
  )
  // some share targets take files but not files + text — then image only
  const data = navigator.canShare?.({ files: [file], text })
    ? { files: [file], text }
    : navigator.canShare?.({ files: [file] })
      ? { files: [file] }
      : null
  if (data) {
    try {
      await navigator.share(data)
      if (await copyLink) showToast('Link copied too — add it as a link sticker 🔗', 'success')
      return
    } catch (err) {
      if (err?.name === 'AbortError') return // user closed the share sheet
    }
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob, 'text/plain': new Blob([text], { type: 'text/plain' }) }),
    ])
    showToast('Image copied (with your link) — paste it into your story 📸', 'success')
  } catch {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    const copied = await copyLink
    showToast(copied ? 'Image downloaded 📸 — link copied too 🔗' : 'Image downloaded 📸', 'success')
  }
}
