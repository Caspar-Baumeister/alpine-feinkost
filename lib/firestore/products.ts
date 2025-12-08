import { db } from '@/lib/firebase'
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { Product } from './types'

const COLLECTION = 'products'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToProduct(id: string, data: Record<string, unknown>): Product {
  const totalStock = data.totalStock as number ?? 0
  // If currentStock is not set, default to totalStock (for backwards compatibility)
  const currentStock = data.currentStock as number ?? totalStock
  const labels = (data.labels as string[]) ?? []

  return {
    id,
    name: data.name as string,
    sku: data.sku as string || '',
    labels,
    unitType: data.unitType as 'piece' | 'weight',
    unitLabel: data.unitLabel as string || (data.unitType === 'piece' ? 'Stück' : 'kg'),
    basePrice: data.basePrice as number,
    description: data.description as string || '',
    imagePath: (data.imagePath as string) || null,
    isActive: data.isActive as boolean ?? true,
    totalStock,
    currentStock,
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
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = await addDoc(colRef, {
    name: data.name,
    sku: data.sku,
    labels: data.labels || [],
    unitType: data.unitType,
    unitLabel: data.unitLabel,
    basePrice: data.basePrice,
    description: data.description,
    imagePath: data.imagePath,
    isActive: data.isActive,
    totalStock: 0,
    currentStock: 0,
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
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

/**
 * Update product stock values.
 * When updating totalStock manually (e.g., physical inventory count),
 * we also adjust currentStock by the same delta to keep them in sync.
 */
export async function updateProductStock(
  id: string,
  totalStock: number,
  currentStock?: number
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  // If currentStock is provided, use it directly
  if (currentStock !== undefined) {
    await updateDoc(docRef, {
      totalStock,
      currentStock,
      updatedAt: serverTimestamp()
    })
  } else {
    // Otherwise, get current values and adjust currentStock by the same delta
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      const oldTotalStock = data.totalStock as number ?? 0
      const oldCurrentStock = data.currentStock as number ?? oldTotalStock
      const delta = totalStock - oldTotalStock
      const newCurrentStock = oldCurrentStock + delta

      await updateDoc(docRef, {
        totalStock,
        currentStock: newCurrentStock,
        updatedAt: serverTimestamp()
      })
    } else {
      await updateDoc(docRef, {
        totalStock,
        currentStock: totalStock,
        updatedAt: serverTimestamp()
      })
    }
  }
}

