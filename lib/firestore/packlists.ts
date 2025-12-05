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
  orderBy,
  where
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Packlist, PacklistStatus, PacklistItem } from './types'

const COLLECTION = 'packlists'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToPacklist(id: string, data: Record<string, unknown>): Packlist {
  const items = (data.items as Record<string, unknown>[] || []).map((item) => ({
    productId: item.productId as string,
    productName: item.productName as string || '',
    unitType: item.unitType as 'piece' | 'weight',
    unitLabel: item.unitLabel as string,
    basePrice: item.basePrice as number,
    specialPrice: (item.specialPrice as number) || null,
    plannedQuantity: item.plannedQuantity as number,
    startQuantity: (item.startQuantity as number) ?? null,
    endQuantity: (item.endQuantity as number) ?? null,
    note: item.note as string || ''
  }))

  return {
    id,
    posId: data.posId as string,
    posName: data.posName as string || '',
    status: data.status as PacklistStatus,
    date: timestampToDate(data.date as Timestamp) || new Date(),
    assignedUserIds: data.assignedUserIds as string[] || [],
    changeAmount: data.changeAmount as number || 0,
    note: data.note as string || '',
    templateId: (data.templateId as string) || null,
    reportedCash: (data.reportedCash as number) ?? null,
    expectedCash: (data.expectedCash as number) ?? null,
    difference: (data.difference as number) ?? null,
    createdBy: data.createdBy as string || '',
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null),
    closedAt: timestampToDate(data.closedAt as Timestamp | null),
    items
  }
}

interface ListPacklistsOptions {
  status?: PacklistStatus[]
  assignedUserId?: string
}

export async function listPacklists(opts?: ListPacklistsOptions): Promise<Packlist[]> {
  const colRef = collection(db, COLLECTION)
  let q = query(colRef, orderBy('date', 'desc'))

  // Filter by status if provided
  if (opts?.status && opts.status.length > 0) {
    q = query(colRef, where('status', 'in', opts.status), orderBy('date', 'desc'))
  }

  const snapshot = await getDocs(q)
  let packlists = snapshot.docs.map((d) => docToPacklist(d.id, d.data()))

  // Client-side filter for assignedUserId (Firestore doesn't support array-contains with other filters well)
  if (opts?.assignedUserId) {
    packlists = packlists.filter((p) =>
      p.assignedUserIds.includes(opts.assignedUserId!)
    )
  }

  return packlists
}

export async function getPacklist(id: string): Promise<Packlist | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToPacklist(docSnap.id, docSnap.data())
}

export async function createPacklist(
  data: Omit<Packlist, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)

  const docData = {
    posId: data.posId,
    posName: data.posName,
    status: data.status,
    date: Timestamp.fromDate(data.date),
    assignedUserIds: data.assignedUserIds,
    changeAmount: data.changeAmount,
    note: data.note,
    templateId: data.templateId,
    reportedCash: data.reportedCash,
    expectedCash: data.expectedCash,
    difference: data.difference,
    createdBy: data.createdBy,
    items: data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      basePrice: item.basePrice,
      specialPrice: item.specialPrice,
      plannedQuantity: item.plannedQuantity,
      startQuantity: item.startQuantity,
      endQuantity: item.endQuantity,
      note: item.note
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    closedAt: null
  }

  const docRef = await addDoc(colRef, docData)
  return docRef.id
}

export async function updatePacklist(
  id: string,
  data: Partial<Omit<Packlist, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  }

  if (data.posId !== undefined) updateData.posId = data.posId
  if (data.posName !== undefined) updateData.posName = data.posName
  if (data.status !== undefined) updateData.status = data.status
  if (data.date !== undefined) updateData.date = Timestamp.fromDate(data.date)
  if (data.assignedUserIds !== undefined) updateData.assignedUserIds = data.assignedUserIds
  if (data.changeAmount !== undefined) updateData.changeAmount = data.changeAmount
  if (data.note !== undefined) updateData.note = data.note
  if (data.templateId !== undefined) updateData.templateId = data.templateId
  if (data.reportedCash !== undefined) updateData.reportedCash = data.reportedCash
  if (data.expectedCash !== undefined) updateData.expectedCash = data.expectedCash
  if (data.difference !== undefined) updateData.difference = data.difference
  if (data.closedAt !== undefined) {
    updateData.closedAt = data.closedAt ? Timestamp.fromDate(data.closedAt) : null
  }
  if (data.items !== undefined) {
    updateData.items = data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      basePrice: item.basePrice,
      specialPrice: item.specialPrice,
      plannedQuantity: item.plannedQuantity,
      startQuantity: item.startQuantity,
      endQuantity: item.endQuantity,
      note: item.note
    }))
  }

  await updateDoc(docRef, updateData)
}

