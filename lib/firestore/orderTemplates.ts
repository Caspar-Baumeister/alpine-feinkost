import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { OrderTemplate, OrderTemplateItem, ProductUnitType } from './types'

const COLLECTION = 'orderTemplates'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToTemplate(id: string, data: Record<string, unknown>): OrderTemplate {
  const items = (data.items as Record<string, unknown>[] || []).map((item) => {
    const rawUnitType = (item.unitType as ProductUnitType) ?? 'piece'
    const unitType = rawUnitType === 'weight' ? 'kg' : rawUnitType
    return {
      productId: item.productId as string,
      productName: item.productName as string || '',
      unitType,
      unitLabel: item.unitLabel as string,
      defaultQuantity: item.defaultQuantity as number,
      note: item.note as string || ''
    }
  })

  return {
    id,
    name: data.name as string,
    description: data.description as string || '',
    note: data.note as string || '',
    createdBy: data.createdBy as string || '',
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null),
    items
  }
}

export async function listOrderTemplates(): Promise<OrderTemplate[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('name', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToTemplate(d.id, d.data()))
}

export async function getOrderTemplate(id: string): Promise<OrderTemplate | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToTemplate(docSnap.id, docSnap.data())
}

export async function createOrderTemplate(
  data: Omit<OrderTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)

  const docData = {
    name: data.name,
    description: data.description,
    note: data.note,
    createdBy: data.createdBy,
    items: data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      defaultQuantity: item.defaultQuantity,
      note: item.note
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(colRef, docData)
  return docRef.id
}

export async function updateOrderTemplate(
  id: string,
  data: Partial<Omit<OrderTemplate, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.note !== undefined) updateData.note = data.note
  if (data.items !== undefined) {
    updateData.items = data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      defaultQuantity: item.defaultQuantity,
      note: item.note
    }))
  }

  await updateDoc(docRef, updateData)
}

export async function deleteOrderTemplate(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await deleteDoc(docRef)
}

