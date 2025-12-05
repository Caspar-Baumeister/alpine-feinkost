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
import { PacklistTemplate, PacklistTemplateItem } from './types'

const COLLECTION = 'packlistTemplates'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToTemplate(id: string, data: Record<string, unknown>): PacklistTemplate {
  const items = (data.items as Record<string, unknown>[] || []).map((item) => ({
    productId: item.productId as string,
    productName: item.productName as string || '',
    unitType: item.unitType as 'piece' | 'weight',
    unitLabel: item.unitLabel as string,
    basePrice: item.basePrice as number,
    specialPrice: (item.specialPrice as number) || null,
    defaultQuantity: item.defaultQuantity as number,
    note: item.note as string || ''
  }))

  return {
    id,
    name: data.name as string,
    description: data.description as string || '',
    defaultPosId: (data.defaultPosId as string) || null,
    changeAmount: (data.changeAmount as number) ?? null,
    note: data.note as string || '',
    createdBy: data.createdBy as string || '',
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null),
    items
  }
}

export async function listPacklistTemplates(): Promise<PacklistTemplate[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('name', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToTemplate(d.id, d.data()))
}

export async function getPacklistTemplate(id: string): Promise<PacklistTemplate | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToTemplate(docSnap.id, docSnap.data())
}

export async function createPacklistTemplate(
  data: Omit<PacklistTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)

  const docData = {
    name: data.name,
    description: data.description,
    defaultPosId: data.defaultPosId,
    changeAmount: data.changeAmount,
    note: data.note,
    createdBy: data.createdBy,
    items: data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      basePrice: item.basePrice,
      specialPrice: item.specialPrice,
      defaultQuantity: item.defaultQuantity,
      note: item.note
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(colRef, docData)
  return docRef.id
}

export async function updatePacklistTemplate(
  id: string,
  data: Partial<Omit<PacklistTemplate, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.defaultPosId !== undefined) updateData.defaultPosId = data.defaultPosId
  if (data.changeAmount !== undefined) updateData.changeAmount = data.changeAmount
  if (data.note !== undefined) updateData.note = data.note
  if (data.items !== undefined) {
    updateData.items = data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      basePrice: item.basePrice,
      specialPrice: item.specialPrice,
      defaultQuantity: item.defaultQuantity,
      note: item.note
    }))
  }

  await updateDoc(docRef, updateData)
}

