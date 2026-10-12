import imageCompression from 'browser-image-compression'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from '../../shared/firebase.js'

// `onProgress(0–1)` drives the sending ring on your bubble (SendStatus):
// shrinking the image is the first 20%, the upload (real bytes sent) up to
// 95%; the caller finishes it once the message itself is saved.
export async function uploadRoomImage(roomId, file, onProgress = () => {}) {
  onProgress(0.02)
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    onProgress: (percent) => onProgress(0.02 + (percent / 100) * 0.18),
  })

  // anix/ prefix since this bucket is shared with other apps under the
  // same Firebase project — see CLAUDE.md #008.
  const path = `anix/rooms/${roomId}/images/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, compressed)
    task.on(
      'state_changed',
      (snap) => onProgress(0.2 + (snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0) * 0.75),
      reject,
      resolve,
    )
  })
  return getDownloadURL(storageRef)
}
