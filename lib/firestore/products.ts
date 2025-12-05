import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from './types'

const COLLECTION = 'products'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: data.name as string,
    sku: data.sku as string || '',
    unitType: data.unitType as 'piece' | 'weight',
    unitLabel: data.unitLabel as string || (data.unitType === 'piece' ? 'Stück' : 'kg'),
    basePrice: data.basePrice as number,
    description: data.description as string || '',
    imagePath: (data.imagePath as string) || null,
    isActive: data.isActive as boolean ?? true,
    totalStock: data.totalStock as number ?? 0,
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
    unitType: data.unitType,
    unitLabel: data.unitLabel,
    basePrice: data.basePrice,
    description: data.description,
    imagePath: data.imagePath,
    isActive: data.isActive,
    totalStock: data.totalStock,
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

export async function updateProductStock(id: string, totalStock: number): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    totalStock,
    updatedAt: serverTimestamp()
  })
}

