import {
  ref,
  uploadBytes,
  deleteObject
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

const ORDERS_FOLDER = 'orders'

function generateOrderImagePath(orderId: string, extension: string) {
  const safeExt = extension || 'jpg'
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${ORDERS_FOLDER}/${orderId}/bestellliste/${unique}.${safeExt}`
}

export async function uploadOrderDocumentImage(
  orderId: string,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']

  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file type: ${extension}. Allowed: ${allowedExtensions.join(', ')}`)
  }

  const storagePath = generateOrderImagePath(orderId, extension)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      orderId,
      uploadedAt: new Date().toISOString()
    }
  })

  return storagePath
}

export async function deleteOrderDocumentImage(imagePath: string | null | undefined): Promise<void> {
  if (!imagePath) return

  const storageRef = ref(storage, imagePath)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    const errorCode = (error as { code?: string })?.code
    if (errorCode !== 'storage/object-not-found') {
      throw error
    }
  }
}


