import { useEffect } from 'react'
import { useAuthUser } from '../../shared/auth-store.js'
import { migrateGuestStickers } from './my-stickers.js'

// Whenever someone is signed in (a real account, not the admin page's
// anonymous session), stickers they made as a guest in this browser move
// into their account.
export function useGuestStickerMigration() {
  const { user } = useAuthUser()
  const uid = user && !user.isAnonymous ? user.uid : null
  useEffect(() => {
    if (uid) migrateGuestStickers(uid).catch((err) => console.error('sticker migration failed', err))
  }, [uid])
}
