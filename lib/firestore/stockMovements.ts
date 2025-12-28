import { db } from '@/lib/firebase'
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { StockMovement, StockMovementType, AppRole } from './types'
import { AppUser } from './types'

const COLLECTION = 'stockMovements'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToStockMovement(id: string, data: Record<string, unknown>): StockMovement {
  return {
    id,
    productId: data.productId as string,
    orderId: (data.orderId as string | null) ?? null,
    packlistId: (data.packlistId as string | null) ?? null,
    type: data.type as StockMovementType,
    delta: data.delta as number,
    previousStock: data.previousStock as number,
    newStock: data.newStock as number,
    actorUserId: data.actorUserId as string,
    actorName: (data.actorName as string | null) ?? null,
    actorRole: (data.actorRole as AppRole | null) ?? null,
    note: (data.note as string | null) ?? null,
    createdAt: timestampToDate(data.createdAt as Timestamp) ?? new Date()
  }
}

/**
 * Create a stock movement record
 * This should be called within a transaction when updating stock
 */
export async function createStockMovement(
  movement: Omit<StockMovement, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = await addDoc(colRef, {
    productId: movement.productId,
    orderId: movement.orderId,
    packlistId: movement.packlistId,
    type: movement.type,
    delta: movement.delta,
    previousStock: movement.previousStock,
    newStock: movement.newStock,
    actorUserId: movement.actorUserId,
    actorName: movement.actorName,
    actorRole: movement.actorRole,
    note: movement.note,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

/**
 * List stock movements for a specific product
 */
export async function listStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, where('productId', '==', productId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToStockMovement(d.id, d.data()))
}

/**
 * List stock movements for a specific order
 */
export async function listStockMovementsByOrder(orderId: string): Promise<StockMovement[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, where('orderId', '==', orderId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToStockMovement(d.id, d.data()))
}

/**
 * List stock movements for a specific packlist
 */
export async function listStockMovementsByPacklist(packlistId: string): Promise<StockMovement[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, where('packlistId', '==', packlistId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToStockMovement(d.id, d.data()))
}

/**
 * Helper to get actor info from user (if available)
 */
export function getActorInfo(user: AppUser | null): {
  actorName: string | null
  actorRole: AppRole | null
} {
  if (!user) {
    return { actorName: null, actorRole: null }
  }
  return {
    actorName: user.displayName || null,
    actorRole: user.role || null
  }
}

