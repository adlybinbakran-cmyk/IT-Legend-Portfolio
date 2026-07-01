import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
} from "firebase/storage"
import { storage } from "./firebase"

export interface UploadResult {
  url: string
  path: string
  name: string
}

export const uploadFile = (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      "state_changed",
      (snap) => {
        const progress = (snap.bytesTransferred / snap.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path: task.snapshot.ref.fullPath, name: file.name })
      }
    )
  })
}

export const deleteFile = async (fullPath: string) => {
  const storageRef = ref(storage, fullPath)
  await deleteObject(storageRef)
}

export const listFolder = async (folderPath: string) => {
  const folderRef = ref(storage, folderPath)
  const result = await listAll(folderRef)

  const items = await Promise.all(
    result.items.map(async (item: StorageReference) => {
      const url = await getDownloadURL(item)
      return {
        name: item.name,
        fullPath: item.fullPath,
        url,
      }
    })
  )

  return items
}

export const getFileUrl = async (fullPath: string) => {
  const storageRef = ref(storage, fullPath)
  return getDownloadURL(storageRef)
}
