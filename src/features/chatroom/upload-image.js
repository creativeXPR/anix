import imageCompression from 'browser-image-compression'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../shared/firebase.js'

export async function uploadRoomImage(roomId, file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
  })

  // anix/ prefix since this bucket is shared with other apps under the
  // same Firebase project — see CLAUDE.md #008.
  const path = `anix/rooms/${roomId}/images/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, compressed)
  return getDownloadURL(storageRef)
}
