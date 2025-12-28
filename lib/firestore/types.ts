// ===== Common Types =====
export type AppRole = 'superadmin' | 'admin' | 'worker'
export type AppLocale = 'de' | 'en'
export type ProductUnitType = 'piece' | 'weight' | 'kg' | 'g' | 'ml'
export type PacklistStatus = 'open' | 'currently_selling' | 'sold' | 'completed'

// ===== User =====
export type AppUser = {
  uid: string
  email: string
  displayName: string
  role: AppRole
  locale: AppLocale
  active: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== Product =====
export type Product = {
  id: string
  name?: string | null        // legacy
  nameDe: string
  nameEn: string | null
  sku: string
  labels: string[]           // Array of label slugs
  unitType: ProductUnitType
  unitLabel?: string | null   // legacy/custom; UI derives defaults
  basePrice: number
  description?: string | null  // legacy
  descriptionDe: string | null
  descriptionEn: string | null
  imagePaths?: string[]       // ordered list; first is primary
  imagePath?: string | null   // legacy single image
  availableAtPosIds?: string[] | null
  isActive: boolean
  currentStock: number    // What's physically in warehouse (single source of truth)
  lastStockUpdatedByUserId?: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== Stock Movement =====
export type StockMovementType = 'delivery_received' | 'packlist_created' | 'return_confirmed' | 'manual_adjustment'

export type StockMovement = {
  id: string
  productId: string
  orderId: string | null      // Reference to order if type is delivery_received
  packlistId: string | null   // Reference to packlist if type is packlist_created or return_confirmed
  type: StockMovementType
  delta: number               // Signed number: +incoming / -outgoing
  previousStock: number
  newStock: number
  actorUserId: string
  actorName: string | null
  actorRole: AppRole | null
  note: string | null          // Optional context (e.g., supplier, delivery note number)
  createdAt: Date
}

// ===== Label =====
export type Label = {
  id: string
  slug: string
  nameEn: string
  nameDe: string
  descriptionDe: string
  descriptionEn: string
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== POS =====
export type Pos = {
  id: string
  name: string
  address: string | null
  active: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== Packlist =====
export type PacklistItem = {
  productId: string
  productName: string
  unitType: ProductUnitType
  unitLabel: string
  basePrice: number
  specialPrice: number | null
  plannedQuantity: number
  startQuantity: number | null
  endQuantity: number | null
  note: string
}

export type Packlist = {
  id: string
  posId: string
  posName: string
  status: PacklistStatus
  date: Date
  assignedUserIds: string[]
  changeAmount: number
  note: string | null
  workerNote: string | null
  templateId: string | null
  reportedCash: number | null
  expectedCash: number | null
  difference: number | null
  items: PacklistItem[]
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
  closedAt: Date | null
}

// ===== Packlist Template =====
export type PacklistTemplateItem = {
  productId: string
  productName: string
  unitType: ProductUnitType
  unitLabel: string
  basePrice: number
  specialPrice: number | null
  defaultQuantity: number
  note: string
}

export type PacklistTemplate = {
  id: string
  name: string
  description: string
  defaultPosId: string | null
  changeAmount: number | null
  note: string
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
  items: PacklistTemplateItem[]
}

// ===== Order =====
export type OrderStatus = 'open' | 'check_pending' | 'completed'

export type OrderItem = {
  productId: string
  productName: string
  unitType: ProductUnitType
  unitLabel: string
  // Snapshot of unit type at time of ordering to keep totals stable
  unitTypeSnapshot: ProductUnitType
  orderedQuantity: number
  receivedQuantity: number | null  // null until delivery is checked
  note: string
}

export type Order = {
  id: string
  name: string | null  // Optional order reference/name (also used for "Lieferschein Nummer" when order is received)
  orderDate: Date  // Used as "Erwartetes Lieferdatum" in UI
  expectedArrivalDate: Date  // Used as "Lieferdatum" in UI (actual delivery date when received)
  status: OrderStatus
  note: string
  templateId: string | null
  items: OrderItem[]
  // Persisted totals derived from items[]
  totalKg: number
  totalPieces: number
  // Optional photo of the Bestellliste/Auftrag
  bestelllistePhoto?: {
    storagePath: string
    contentType?: string
    originalFileName?: string
    sizeBytes?: number
  } | null
  // Supplier information
  supplierLabel: string | null  // Free text "Lieferant"
  confirmedBy: string | null
  confirmedAt: Date | null
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== Order Template =====
export type OrderTemplateItem = {
  productId: string
  productName: string
  unitType: ProductUnitType
  unitLabel: string
  defaultQuantity: number
  note: string
}

export type OrderTemplate = {
  id: string
  name: string
  description: string
  note: string
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
  items: OrderTemplateItem[]
}
