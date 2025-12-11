import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

const PRODUCTS_FOLDER = 'products'

function generateImagePath(productId: string, extension: string) {
  const safeExt = extension || 'jpg'
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${PRODUCTS_FOLDER}/${productId}/${unique}.${safeExt}`
}

/**
 * Upload a product image to Firebase Storage
 * @param productId - The product ID (used as filename)
 * @param file - The image file to upload
 * @returns The storage path of the uploaded image
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']

  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file type: ${extension}. Allowed: ${allowedExtensions.join(', ')}`)
  }

  const storagePath = generateImagePath(productId, extension)
  const storageRef = ref(storage, storagePath)

  // Upload the file
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      productId,
      uploadedAt: new Date().toISOString()
    }
  })

  return storagePath
}

/**
 * Get the download URL for a product image
 * @param imagePath - The storage path of the image
 * @returns The download URL
 */
export async function getProductImageUrl(imagePath: string): Promise<string> {
  if (!imagePath) {
    throw new Error('Image path is required')
  }

  const storageRef = ref(storage, imagePath)
  return await getDownloadURL(storageRef)
}

/**
 * Delete a product image from Firebase Storage
 * @param imagePath - The storage path of the image to delete
 */
export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath) return

  const storageRef = ref(storage, imagePath)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    // Ignore if file doesn't exist
    const errorCode = (error as { code?: string })?.code
    if (errorCode !== 'storage/object-not-found') {
      throw error
    }
  }
}

/**
 * Upload a product image and return both path and URL
 */
export async function uploadProductImageWithUrl(
  productId: string,
  file: File
): Promise<{ path: string; url: string }> {
  const path = await uploadProductImage(productId, file)
  const url = await getProductImageUrl(path)
  return { path, url }
}

