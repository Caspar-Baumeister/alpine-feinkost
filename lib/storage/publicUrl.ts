const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

export function getPublicStorageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (!BUCKET) return null

  const normalizedPath = path.replace(/^\/+/, '')
  const encodedPath = encodeURIComponent(normalizedPath)

  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodedPath}?alt=media`
}

