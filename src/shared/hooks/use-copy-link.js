import { useToast } from '../toast-store.js'

export function useCopyLink() {
  const showToast = useToast()

  return async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url)
      showToast('Copied', 'success')
    } catch {
      showToast('Could not copy link', 'error')
    }
  }
}
