import { getStorage } from 'firebase/storage'
import { firebaseApp } from './firebase.js'

// Split from firebase.js so the Storage SDK loads only with screens that
// upload (room images, banners, stickers).
export const storage = getStorage(firebaseApp)
