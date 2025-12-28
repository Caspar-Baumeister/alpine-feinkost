import { db } from '@/lib/firebase'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { Product, ProductUnitType } from './types'

const COLLECTION = 'products'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToProduct(id: string, data: Record<string, unknown>): Product {
  // Backward compatibility: if totalStock exists but currentStock doesn't, use totalStock
  // Otherwise use currentStock, defaulting to 0
  const legacyTotalStock = (data.totalStock as number | undefined) ?? 0
  const currentStock = (data.currentStock as number | undefined) ?? legacyTotalStock
  const labels = (data.labels as string[]) ?? []
  const legacyName = (data.name as string) ?? ''
  const nameDe = (data.nameDe as string | null) ?? legacyName
  const nameEn = (data.nameEn as string | null) ?? null
  const legacyDescription = (data.description as string) ?? null
  const descriptionDe = (data.descriptionDe as string | null) ?? legacyDescription ?? null
  const descriptionEn = (data.descriptionEn as string | null) ?? null
  const rawUnitType = (data.unitType as ProductUnitType) ?? 'piece'
  const unitType = rawUnitType === 'weight' ? 'kg' : rawUnitType
  const lastStockUpdatedByUserId = (data.lastStockUpdatedByUserId as string | null) ?? null
  const imagePathsRaw = (data.imagePaths as string[] | undefined) || []
  const imagePathLegacy = (data.imagePath as string | null) || null
  const imagePaths = imagePathsRaw.length ? imagePathsRaw : (imagePathLegacy ? [imagePathLegacy] : [])
  const primaryImagePath = imagePaths[0] || imagePathLegacy || null
  const availableAtPosIdsRaw = data.availableAtPosIds as string[] | undefined
  const availableAtPosIds = Array.isArray(availableAtPosIdsRaw) ? availableAtPosIdsRaw : null

  return {
    id,
    name: legacyName,
    nameDe,
    nameEn,
    sku: data.sku as string || '',
    labels,
    unitType,
    basePrice: data.basePrice as number,
    description: legacyDescription,
    descriptionDe,
    descriptionEn,
    imagePaths,
    imagePath: primaryImagePath,
    availableAtPosIds,
    isActive: data.isActive as boolean ?? true,
    currentStock,
    lastStockUpdatedByUserId,
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function listProducts(): Promise<Product[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('name', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToProduct(d.id, d.data()))
}

export async function getProduct(id: string): Promise<Product | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToProduct(docSnap.id, docSnap.data())
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = id ? doc(colRef, id) : doc(colRef)
  const imagePaths = data.imagePaths ?? []
  const imagePath = imagePaths[0] ?? data.imagePath ?? null

  await setDoc(docRef, {
    name: data.nameDe, // keep legacy name for compatibility
    nameDe: data.nameDe,
    nameEn: data.nameEn ?? null,
    sku: data.sku,
    labels: data.labels || [],
    unitType: data.unitType,
    basePrice: data.basePrice,
    descriptionDe: data.descriptionDe ?? '',
    descriptionEn: data.descriptionEn ?? null,
    imagePaths,
    imagePath,
    isActive: data.isActive,
    currentStock: 0,
    lastStockUpdatedByUserId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return docRef.id
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  const { description, ...rest } = data
  const hasImagePaths = rest.imagePaths !== undefined
  const imagePaths = rest.imagePaths ?? []
  const imagePath = hasImagePaths
    ? (imagePaths[0] ?? null)
    : (rest.imagePath === undefined ? undefined : rest.imagePath)

  await updateDoc(docRef, {
    ...rest,
    ...(hasImagePaths ? { imagePaths, imagePath } : {}),
    updatedAt: serverTimestamp()
  })
}

/**
 * Update product current stock (manual adjustment, e.g., physical inventory count).
 * This is the single source of truth for stock.
 */
export async function updateProductStock(
  id: string,
  currentStock: number,
  updatedByUserId?: string | null
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  const stockUserUpdate = updatedByUserId !== undefined
    ? { lastStockUpdatedByUserId: updatedByUserId ?? null }
    : {}

  await updateDoc(docRef, {
    currentStock,
    ...stockUserUpdate,
    updatedAt: serverTimestamp()
  })
}

