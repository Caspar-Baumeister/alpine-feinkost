import { db } from '@/lib/firebase'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore'
import { Order, OrderStatus, OrderItem, ProductUnitType } from './types'

const COLLECTION = 'orders'
const PRODUCTS_COLLECTION = 'products'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function isWeightUnit(unitType: ProductUnitType): boolean {
  return unitType === 'kg' || unitType === 'weight' || unitType === 'g'
}

function toKg(value: number, unitType: ProductUnitType): number {
  if (unitType === 'g') {
    return value / 1000
  }
  // For kg or generic weight, use value as-is
  return value
}

function calculateTotalsFromItems(items: OrderItem[]): { totalKg: number; totalPieces: number } {
  let totalKg = 0
  let totalPieces = 0

  for (const item of items) {
    const unitTypeSnapshot = item.unitTypeSnapshot || item.unitType
    if (isWeightUnit(unitTypeSnapshot)) {
      totalKg += toKg(item.orderedQuantity, unitTypeSnapshot)
    } else {
      totalPieces += item.orderedQuantity
    }
  }

  return {
    totalKg: Number(totalKg.toFixed(2)),
    totalPieces
  }
}

function docToOrder(id: string, data: Record<string, unknown>): Order {
  const items = ((data.items as Record<string, unknown>[]) || []).map((item) => {
    const rawUnitType = (item.unitType as ProductUnitType) ?? 'piece'
    const unitType = rawUnitType === 'weight' ? 'kg' : rawUnitType
    const unitTypeSnapshot = (item.unitTypeSnapshot as ProductUnitType) ?? unitType

    return {
      productId: item.productId as string,
      productName: (item.productName as string) || '',
      unitType,
      unitLabel: item.unitLabel as string,
      unitTypeSnapshot,
      orderedQuantity: item.orderedQuantity as number,
      receivedQuantity: (item.receivedQuantity as number | null) ?? null,
      note: (item.note as string) || ''
    }
  })

  const storedTotalKg = (data.totalKg as number | null) ?? null
  const storedTotalPieces = (data.totalPieces as number | null) ?? null
  const { totalKg, totalPieces } =
    storedTotalKg === null || storedTotalPieces === null
      ? calculateTotalsFromItems(items)
      : { totalKg: storedTotalKg, totalPieces: storedTotalPieces }

  return {
    id,
    name: (data.name as string | null) ?? null,
    orderDate: timestampToDate(data.orderDate as Timestamp) ?? new Date(),
    expectedArrivalDate: timestampToDate(data.expectedArrivalDate as Timestamp) ?? new Date(),
    status: (data.status as OrderStatus) ?? 'open',
    note: (data.note as string) || '',
    templateId: (data.templateId as string | null) ?? null,
    items,
    totalKg,
    totalPieces,
    bestelllistePhoto: (data.bestelllistePhoto as Order['bestelllistePhoto']) ?? null,
    confirmedBy: (data.confirmedBy as string | null) ?? null,
    confirmedAt: timestampToDate(data.confirmedAt as Timestamp | null),
    createdBy: (data.createdBy as string) || '',
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function listOrders(): Promise<Order[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('expectedArrivalDate', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToOrder(d.id, d.data()))
}

export async function listOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(
    colRef,
    where('status', '==', status),
    orderBy('expectedArrivalDate', 'asc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToOrder(d.id, d.data()))
}

export async function getOrder(id: string): Promise<Order | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToOrder(docSnap.id, docSnap.data())
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'confirmedBy' | 'confirmedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)

  const itemsWithSnapshot: OrderItem[] = data.items.map((item) => ({
    ...item,
    unitTypeSnapshot: item.unitTypeSnapshot || item.unitType
  }))

  const { totalKg, totalPieces } = calculateTotalsFromItems(itemsWithSnapshot)

  const docData = {
    name: data.name,
    orderDate: Timestamp.fromDate(data.orderDate),
    expectedArrivalDate: Timestamp.fromDate(data.expectedArrivalDate),
    status: data.status,
    note: data.note,
    templateId: data.templateId,
    createdBy: data.createdBy,
    items: itemsWithSnapshot.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      unitTypeSnapshot: item.unitTypeSnapshot,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: null,
      note: item.note
    })),
    totalKg,
    totalPieces,
    bestelllistePhoto: data.bestelllistePhoto ?? null,
    confirmedBy: null,
    confirmedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(colRef, docData)
  return docRef.id
}

export async function updateOrder(
  id: string,
  data: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'confirmedBy' | 'confirmedAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.orderDate !== undefined) updateData.orderDate = Timestamp.fromDate(data.orderDate)
  if (data.expectedArrivalDate !== undefined) {
    updateData.expectedArrivalDate = Timestamp.fromDate(data.expectedArrivalDate)
  }
  if (data.status !== undefined) updateData.status = data.status
  if (data.note !== undefined) updateData.note = data.note
  if (data.templateId !== undefined) updateData.templateId = data.templateId
  if (data.items !== undefined) {
    const itemsWithSnapshot: OrderItem[] = data.items.map((item) => ({
      ...item,
      unitTypeSnapshot: item.unitTypeSnapshot || item.unitType
    }))
    const totals = calculateTotalsFromItems(itemsWithSnapshot)

    updateData.items = itemsWithSnapshot.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitType: item.unitType,
      unitLabel: item.unitLabel,
      unitTypeSnapshot: item.unitTypeSnapshot,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      note: item.note
    }))
    updateData.totalKg = totals.totalKg
    updateData.totalPieces = totals.totalPieces
  }
  if (data.bestelllistePhoto !== undefined) {
    updateData.bestelllistePhoto = data.bestelllistePhoto
  }

  await updateDoc(docRef, updateData)
}

/**
 * Confirm an order (when delivery arrives and is checked):
 * - Updates stock: adds received quantities to both totalStock and currentStock
 * - Sets order status to 'completed'
 * - Records who confirmed and when
 */
export async function confirmOrder(
  id: string,
  itemsWithReceivedQuantity: Array<{ productId: string; receivedQuantity: number }>,
  confirmedByUserId: string
): Promise<void> {
  const orderRef = doc(db, COLLECTION, id)
  const stockUserUpdate = {
    lastStockUpdatedByUserId: confirmedByUserId
  }

  await runTransaction(db, async (transaction) => {
    // Read the order
    const orderSnap = await transaction.get(orderRef)
    if (!orderSnap.exists()) {
      throw new Error('Order not found')
    }

    const orderData = orderSnap.data()
    const currentStatus = orderData.status as OrderStatus

    if (currentStatus === 'completed') {
      throw new Error('Order is already completed')
    }

    // Update order items with received quantities
    const existingItems = orderData.items as Record<string, unknown>[]
    const updatedItems = existingItems.map((item) => {
      const receivedItem = itemsWithReceivedQuantity.find(
        (ri) => ri.productId === item.productId
      )
      return {
        ...item,
        receivedQuantity: receivedItem?.receivedQuantity ?? item.orderedQuantity
      }
    })

    // For each item, prepare product stock updates
    const productUpdates: Array<{
      productId: string
      newTotalStock: number
      newCurrentStock: number
    }> = []

    for (const item of updatedItems) {
      const productId = item.productId as string
      const receivedQty = item.receivedQuantity as number

      if (receivedQty <= 0) continue // Skip items with no received quantity

      const productRef = doc(db, PRODUCTS_COLLECTION, productId)
      const productSnap = await transaction.get(productRef)

      if (productSnap.exists()) {
        const productData = productSnap.data()
        const currentTotalStock = (productData.totalStock as number) ?? 0
        const currentCurrentStock = (productData.currentStock as number) ?? currentTotalStock

        // Add received quantity to both totalStock and currentStock
        const newTotalStock = currentTotalStock + receivedQty
        const newCurrentStock = currentCurrentStock + receivedQty

        productUpdates.push({
          productId,
          newTotalStock,
          newCurrentStock
        })
      }
    }

    // After all reads, perform the product stock updates
    for (const update of productUpdates) {
      const productRef = doc(db, PRODUCTS_COLLECTION, update.productId)
      transaction.update(productRef, {
        totalStock: update.newTotalStock,
        currentStock: update.newCurrentStock,
        ...stockUserUpdate,
        updatedAt: serverTimestamp()
      })
    }

    // Write: update the order
    transaction.update(orderRef, {
      status: 'completed',
      items: updatedItems,
      confirmedBy: confirmedByUserId,
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}

