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
  where,
  runTransaction
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Packlist, PacklistStatus, PacklistItem, Product, ProductUnitType } from './types'

const COLLECTION = 'packlists'
const PRODUCTS_COLLECTION = 'products'

function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToPacklist(id: string, data: Record<string, unknown>): Packlist {
  const items = (data.items as Record<string, unknown>[] || []).map((item) => {
    const rawUnitType = (item.unitType as ProductUnitType) ?? 'piece'
    const unitType = rawUnitType === 'weight' ? 'kg' : rawUnitType
    return {
      productId: item.productId as string,
      productName: item.productName as string || '',
      unitType,
      unitLabel: item.unitLabel as string,
      basePrice: item.basePrice as number,
      specialPrice: (item.specialPrice as number) || null,
      plannedQuantity: item.plannedQuantity as number,
      startQuantity: (item.startQuantity as number) ?? null,
      endQuantity: (item.endQuantity as number) ?? null,
      note: item.note as string || ''
    }
  })

  return {
    id,
    posId: data.posId as string,
    posName: data.posName as string || '',
    status: data.status as PacklistStatus,
    date: timestampToDate(data.date as Timestamp) || new Date(),
    assignedUserIds: data.assignedUserIds as string[] || [],
    changeAmount: data.changeAmount as number || 0,
    note: data.note as string || '',
    workerNote: (data.workerNote as string) || null,
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

/**
 * Create a new packlist with stock reservation.
 * When a packlist is created with status 'open':
 * - Subtract plannedQuantity from each product's currentStock
 * - Do NOT change totalStock (products are just reserved, not sold)
 */
export async function createPacklist(
  data: Omit<Packlist, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>,
  stockUpdatedByUserId?: string | null
): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const stockUpdatedBy = stockUpdatedByUserId ?? data.createdBy ?? null

  // Use a transaction to atomically update stock and create the packlist
  const packlistId = await runTransaction(db, async (transaction) => {
    // For each item, read and update the product's currentStock
    for (const item of data.items) {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId)
      const productSnap = await transaction.get(productRef)

      if (!productSnap.exists()) {
        throw new Error(`Product ${item.productId} not found`)
      }

      const productData = productSnap.data()
      const currentStock = productData.currentStock as number ?? productData.totalStock as number ?? 0
      const newCurrentStock = currentStock - item.plannedQuantity

      if (newCurrentStock < 0) {
        console.warn(`Product ${item.productName} will have negative currentStock: ${newCurrentStock}`)
      }

      // Update product's currentStock (reserve the items)
      transaction.update(productRef, {
        currentStock: newCurrentStock,
        lastStockUpdatedByUserId: stockUpdatedBy,
        updatedAt: serverTimestamp()
      })
    }

    // Create the packlist document
    const newDocRef = doc(colRef)
    const docData = {
      posId: data.posId,
      posName: data.posName,
      status: data.status,
      date: Timestamp.fromDate(data.date),
      assignedUserIds: data.assignedUserIds,
      changeAmount: data.changeAmount,
      note: data.note,
      workerNote: data.workerNote,
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

    transaction.set(newDocRef, docData)
    return newDocRef.id
  })

  return packlistId
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
  if (data.workerNote !== undefined) updateData.workerNote = data.workerNote
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

// ========================================
// Stock-safe operations with transactions
// ========================================

interface StartSellingItem {
  productId: string
  startQuantity: number
}

/**
 * Start selling a packlist:
 * - Sets startQuantity for each item
 * - Changes status to 'currently_selling'
 * - Adjusts currentStock if startQuantity differs from plannedQuantity
 *   (e.g., if worker takes more or less than planned)
 * - Does NOT change totalStock (nothing is sold yet)
 */
export async function startSellingPacklist(
  id: string,
  itemsWithStartQuantity: StartSellingItem[],
  updatedByUserId?: string | null
): Promise<void> {
  const packlistRef = doc(db, COLLECTION, id)
  const stockUserUpdate = updatedByUserId !== undefined
    ? { lastStockUpdatedByUserId: updatedByUserId ?? null }
    : {}

  await runTransaction(db, async (transaction) => {
    // Read the packlist
    const packlistSnap = await transaction.get(packlistRef)
    if (!packlistSnap.exists()) {
      throw new Error('Packlist not found')
    }

    const packlistData = packlistSnap.data()
    const currentStatus = packlistData.status as PacklistStatus

    if (currentStatus !== 'open') {
      throw new Error(`Cannot start selling: packlist status is '${currentStatus}', expected 'open'`)
    }

    const existingItems = packlistData.items as Record<string, unknown>[]

    // For each item, check if startQuantity differs from plannedQuantity
    // If so, adjust currentStock by the difference
    const stockAdjustments: Map<string, number> = new Map()

    for (const startItem of itemsWithStartQuantity) {
      const existingItem = existingItems.find((ei) => ei.productId === startItem.productId)
      if (!existingItem) continue

      const plannedQuantity = existingItem.plannedQuantity as number
      const startQuantity = startItem.startQuantity
      const difference = startQuantity - plannedQuantity

      // Only adjust if there's a difference
      // difference > 0 means taking more than planned -> subtract from currentStock
      // difference < 0 means taking less than planned -> add to currentStock
      if (difference !== 0) {
        const productRef = doc(db, PRODUCTS_COLLECTION, startItem.productId)
        const productSnap = await transaction.get(productRef)

        if (!productSnap.exists()) {
          throw new Error(`Product ${startItem.productId} not found`)
        }

        const productData = productSnap.data()
        const currentStock = productData.currentStock as number ?? productData.totalStock as number ?? 0
        const newCurrentStock = currentStock - difference

        if (newCurrentStock < 0) {
          console.warn(`Product ${startItem.productId} will have negative currentStock: ${newCurrentStock}`)
        }

        stockAdjustments.set(startItem.productId, newCurrentStock)
      }
    }

    // Update items with startQuantity
    const updatedItems = existingItems.map((item) => {
      const startItem = itemsWithStartQuantity.find((si) => si.productId === item.productId)
      if (startItem) {
        return {
          ...item,
          startQuantity: startItem.startQuantity
        }
      }
      return {
        ...item,
        startQuantity: item.plannedQuantity // fallback to plannedQuantity
      }
    })

    // Write: update each product's currentStock where there was a difference
    for (const [productId, newCurrentStock] of stockAdjustments.entries()) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId)
      transaction.update(productRef, {
        currentStock: newCurrentStock,
        ...stockUserUpdate,
        updatedAt: serverTimestamp()
      })
    }

    // Write: update the packlist
    transaction.update(packlistRef, {
      status: 'currently_selling',
      items: updatedItems,
      updatedAt: serverTimestamp()
    })
  })
}

interface FinishSellingItem {
  productId: string
  endQuantity: number
}

/**
 * Finish selling a packlist:
 * - Sets endQuantity for each item
 * - Sets reportedCash and workerNote
 * - Changes status to 'sold'
 * - No stock changes (admin will handle returns)
 */
export async function finishSellingPacklist(
  id: string,
  itemsWithEndQuantity: FinishSellingItem[],
  reportedCash: number,
  workerNote?: string
): Promise<void> {
  const packlistRef = doc(db, COLLECTION, id)

  await runTransaction(db, async (transaction) => {
    const packlistSnap = await transaction.get(packlistRef)
    if (!packlistSnap.exists()) {
      throw new Error('Packlist not found')
    }

    const packlistData = packlistSnap.data()
    const currentStatus = packlistData.status as PacklistStatus

    if (currentStatus !== 'currently_selling') {
      throw new Error(`Cannot finish selling: packlist status is '${currentStatus}', expected 'currently_selling'`)
    }

    const existingItems = packlistData.items as Record<string, unknown>[]

    // Update items with endQuantity
    const updatedItems = existingItems.map((item) => {
      const endItem = itemsWithEndQuantity.find((ei) => ei.productId === item.productId)
      return {
        ...item,
        endQuantity: endItem?.endQuantity ?? 0
      }
    })

    // Write: update the packlist
    transaction.update(packlistRef, {
      status: 'sold',
      items: updatedItems,
      reportedCash,
      workerNote: workerNote || null,
      updatedAt: serverTimestamp()
    })
  })
}

/**
 * Complete a packlist (admin action):
 * - Computes soldQuantity, expectedCash, difference
 * - Updates stock:
 *   - totalStock -= soldQuantity (goods that are really sold leave our total stock)
 *   - currentStock += endQuantity (leftover goods return to warehouse)
 * - Changes status to 'completed'
 */
export async function completePacklist(
  id: string,
  updatedByUserId?: string | null
): Promise<void> {
  const packlistRef = doc(db, COLLECTION, id)
  const stockUserUpdate = updatedByUserId !== undefined
    ? { lastStockUpdatedByUserId: updatedByUserId ?? null }
    : {}

  await runTransaction(db, async (transaction) => {
    // Read the packlist
    const packlistSnap = await transaction.get(packlistRef)
    if (!packlistSnap.exists()) {
      throw new Error('Packlist not found')
    }

    const packlistData = packlistSnap.data()
    const currentStatus = packlistData.status as PacklistStatus

    if (currentStatus !== 'sold') {
      throw new Error(`Cannot complete: packlist status is '${currentStatus}', expected 'sold'`)
    }

    const items = packlistData.items as Record<string, unknown>[]
    const changeAmount = packlistData.changeAmount as number ?? 0
    const reportedCash = packlistData.reportedCash as number ?? 0

    // For each item, compute soldQuantity and update both stock values
    interface StockUpdate {
      newTotalStock: number
      newCurrentStock: number
    }
    const productUpdates: Map<string, StockUpdate> = new Map()

    for (const item of items) {
      const productId = item.productId as string
      const startQty = (item.startQuantity as number) ?? (item.plannedQuantity as number)
      const endQty = (item.endQuantity as number) ?? 0
      const soldQty = startQty - endQty

      const productRef = doc(db, PRODUCTS_COLLECTION, productId)
      const productSnap = await transaction.get(productRef)

      if (productSnap.exists()) {
        const productData = productSnap.data()
        const currentTotalStock = productData.totalStock as number ?? 0
        const currentCurrentStock = productData.currentStock as number ?? currentTotalStock

        // totalStock -= soldQuantity (sold goods leave inventory)
        // currentStock += endQuantity (returned goods come back to warehouse)
        const newTotalStock = currentTotalStock - soldQty
        const newCurrentStock = currentCurrentStock + endQty

        productUpdates.set(productId, {
          newTotalStock,
          newCurrentStock
        })
      }
    }

    // Calculate expected cash
    let expectedCash = changeAmount
    for (const item of items) {
      const startQty = (item.startQuantity as number) ?? (item.plannedQuantity as number)
      const endQty = (item.endQuantity as number) ?? 0
      const soldQty = startQty - endQty
      const price = (item.specialPrice as number) ?? (item.basePrice as number)
      expectedCash += soldQty * price
    }

    const difference = reportedCash - expectedCash

    // Write: update each product's stock
    for (const [productId, update] of productUpdates.entries()) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId)
      transaction.update(productRef, {
        totalStock: update.newTotalStock,
        currentStock: update.newCurrentStock,
        ...stockUserUpdate,
        updatedAt: serverTimestamp()
      })
    }

    // Write: update the packlist
    transaction.update(packlistRef, {
      status: 'completed',
      expectedCash,
      difference,
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}

/**
 * Get multiple products by their IDs
 */
export async function getProductsForPacklist(productIds: string[]): Promise<Map<string, Product>> {
  const products = new Map<string, Product>()

  for (const productId of productIds) {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId)
    const productSnap = await getDoc(productRef)

    if (productSnap.exists()) {
      const data = productSnap.data()
      const totalStock = data.totalStock as number ?? 0
      const nameDe = (data.nameDe as string | null) ?? (data.name as string) ?? ''
      const nameEn = (data.nameEn as string | null) ?? null
      const descriptionDe = (data.descriptionDe as string | null) ?? (data.description as string) ?? null
      const descriptionEn = (data.descriptionEn as string | null) ?? null
      const rawUnitType = (data.unitType as ProductUnitType) ?? 'piece'
      const unitType = rawUnitType === 'weight' ? 'kg' : rawUnitType
      const lastStockUpdatedByUserId = (data.lastStockUpdatedByUserId as string | null) ?? null
      const imagePathsRaw = (data.imagePaths as string[] | undefined) || []
      const imagePathLegacy = (data.imagePath as string | null) || null
      const imagePaths = imagePathsRaw.length ? imagePathsRaw : (imagePathLegacy ? [imagePathLegacy] : [])
      const imagePath = imagePaths[0] || imagePathLegacy || null
      products.set(productId, {
        id: productId,
        name: data.name as string,
        nameDe,
        nameEn,
        sku: data.sku as string || '',
        labels: (data.labels as string[]) ?? [],
        unitType,
        imagePaths,
        imagePath,
        basePrice: data.basePrice as number,
        description: data.description as string || '',
        descriptionDe,
        descriptionEn,
        isActive: data.isActive as boolean ?? true,
        totalStock,
        currentStock: data.currentStock as number ?? totalStock,
        lastStockUpdatedByUserId,
        createdAt: timestampToDate(data.createdAt as Timestamp | null),
        updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
      })
    }
  }

  return products
}
