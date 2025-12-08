// ===== Common Types =====
export type AppRole = 'superadmin' | 'admin' | 'worker'
export type AppLocale = 'de' | 'en'
export type ProductUnitType = 'piece' | 'weight'
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
  name: string
  sku: string
  labels: string[]           // Array of label slugs
  unitType: ProductUnitType
  unitLabel: string
  basePrice: number
  description: string
  imagePath: string | null
  isActive: boolean
  totalStock: number      // Total inventory owned (not yet sold)
  currentStock: number    // What's physically in warehouse (not assigned to open/in-progress packlists)
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== Label =====
export type Label = {
  id: string
  slug: string
  nameEn: string
  nameDe: string
  createdAt: Date | null
  updatedAt: Date | null
}

// ===== POS / Market =====
export type Pos = {
  id: string
  name: string
  location: string
  notes: string
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
  note: string
  workerNote: string | null    // Note from worker when finishing sales
  templateId: string | null
  reportedCash: number | null
  expectedCash: number | null
  difference: number | null
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
  closedAt: Date | null
  items: PacklistItem[]
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

