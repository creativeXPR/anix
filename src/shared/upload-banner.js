import imageCompression from 'browser-image-compression'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase.js'

// `kind` picks the Storage path prefix — 'room' -> anix/rooms/{id}/banner/,
// 'endpoint' -> anix/endpoints/{id}/banner/ (see storage.rules).
export async function uploadBanner(kind, id, file) {
  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200 })
  const prefix = kind === 'room' ? 'rooms' : 'endpoints'
  const path = `anix/${prefix}/${id}/banner/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, compressed)
  return getDownloadURL(storageRef)
}
