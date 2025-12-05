/**
 * Mock data for development
 * TODO: Replace with real Firestore data fetching
 */

export interface Product {
  id: string
  name: string
  unit: 'piece' | 'weight'
  basePrice: number
  active: boolean
  thumbnail?: string
  description?: string
}

export interface POS {
  id: string
  name: string
  location: string
  notes?: string
  active: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'worker'
  active: boolean
}

export interface PacklistLineItem {
  id: string
  productId: string
  productName: string
  unit: string
  plannedQuantity: number
  actualQuantity?: number
  remainingQuantity?: number
  specialPrice?: number
  note?: string
}

export interface Packlist {
  id: string
  posId: string
  posName: string
  date: string
  assignedUsers: string[]
  status: 'open' | 'currently_selling' | 'sold' | 'completed'
  expectedCash?: number
  reportedCash?: number
  changeAmount: number
  note?: string
  lineItems: PacklistLineItem[]
}

export interface Template {
  id: string
  name: string
  description?: string
  lastUsed?: string
  lineItems: Omit<PacklistLineItem, 'id' | 'actualQuantity' | 'remainingQuantity'>[]
}

export interface StockItem {
  productId: string
  productName: string
  unit: string
  totalStock: number
  currentStock: number
  lastUpdated: string
}

// Mock Products
export const mockProducts: Product[] = [
  { id: '1', name: 'Alpkäse mild', unit: 'weight', basePrice: 28.5, active: true },
  { id: '2', name: 'Alpkäse würzig', unit: 'weight', basePrice: 32.0, active: true },
  { id: '3', name: 'Bergkäse 12 Monate', unit: 'weight', basePrice: 35.0, active: true },
  { id: '4', name: 'Bergkäse 24 Monate', unit: 'weight', basePrice: 42.0, active: true },
  { id: '5', name: 'Heumilchkäse', unit: 'weight', basePrice: 29.0, active: true },
  { id: '6', name: 'Ziegenkäse frisch', unit: 'piece', basePrice: 8.5, active: true },
  { id: '7', name: 'Ziegenkäse gereift', unit: 'piece', basePrice: 12.0, active: true },
  { id: '8', name: 'Butter 250g', unit: 'piece', basePrice: 5.5, active: true },
  { id: '9', name: 'Rahm 250ml', unit: 'piece', basePrice: 4.0, active: false }
]

// Mock POS
export const mockPOS: POS[] = [
  { id: '1', name: 'Markt am Münsterplatz', location: 'Münsterplatz, Freiburg', notes: 'Jeden Samstag', active: true },
  { id: '2', name: 'Wochenmarkt Staufen', location: 'Marktplatz, Staufen', notes: 'Mittwoch und Samstag', active: true },
  { id: '3', name: 'Bauernmarkt Breisach', location: 'Rheinstraße, Breisach', active: true },
  { id: '4', name: 'Markt Emmendingen', location: 'Marktplatz, Emmendingen', active: false }
]

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Max Mustermann', email: 'max@alpine-feinkost.de', role: 'admin', active: true },
  { id: '2', name: 'Anna Arbeiter', email: 'anna@alpine-feinkost.de', role: 'worker', active: true },
  { id: '3', name: 'Hans Hansen', email: 'hans@alpine-feinkost.de', role: 'worker', active: true },
  { id: '4', name: 'Lisa Lehmann', email: 'lisa@alpine-feinkost.de', role: 'worker', active: false }
]

// Mock Packlists
export const mockPacklists: Packlist[] = [
  {
    id: 'PL-2025-001',
    posId: '1',
    posName: 'Markt am Münsterplatz',
    date: '2025-12-06',
    assignedUsers: ['Anna Arbeiter', 'Hans Hansen'],
    status: 'open',
    expectedCash: 450,
    changeAmount: 100,
    lineItems: [
      { id: '1', productId: '1', productName: 'Alpkäse mild', unit: 'kg', plannedQuantity: 5 },
      { id: '2', productId: '2', productName: 'Alpkäse würzig', unit: 'kg', plannedQuantity: 3 },
      { id: '3', productId: '6', productName: 'Ziegenkäse frisch', unit: 'Stück', plannedQuantity: 10 }
    ]
  },
  {
    id: 'PL-2025-002',
    posId: '2',
    posName: 'Wochenmarkt Staufen',
    date: '2025-12-07',
    assignedUsers: ['Hans Hansen'],
    status: 'currently_selling',
    expectedCash: 380,
    changeAmount: 80,
    lineItems: [
      { id: '1', productId: '3', productName: 'Bergkäse 12 Monate', unit: 'kg', plannedQuantity: 4, actualQuantity: 4 },
      { id: '2', productId: '8', productName: 'Butter 250g', unit: 'Stück', plannedQuantity: 20, actualQuantity: 20 }
    ]
  },
  {
    id: 'PL-2025-003',
    posId: '1',
    posName: 'Markt am Münsterplatz',
    date: '2025-11-30',
    assignedUsers: ['Anna Arbeiter'],
    status: 'sold',
    expectedCash: 520,
    reportedCash: 515,
    changeAmount: 100,
    lineItems: []
  },
  {
    id: 'PL-2025-004',
    posId: '3',
    posName: 'Bauernmarkt Breisach',
    date: '2025-11-29',
    assignedUsers: ['Lisa Lehmann'],
    status: 'completed',
    expectedCash: 280,
    reportedCash: 285,
    changeAmount: 50,
    lineItems: []
  }
]

// Mock Templates
export const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Samstagsmarkt',
    description: 'Typische Zusammenstellung für Samstag',
    lastUsed: '2025-12-01',
    lineItems: [
      { productId: '1', productName: 'Alpkäse mild', unit: 'kg', plannedQuantity: 5 },
      { productId: '2', productName: 'Alpkäse würzig', unit: 'kg', plannedQuantity: 3 },
      { productId: '3', productName: 'Bergkäse 12 Monate', unit: 'kg', plannedQuantity: 4 },
      { productId: '6', productName: 'Ziegenkäse frisch', unit: 'Stück', plannedQuantity: 15 },
      { productId: '8', productName: 'Butter 250g', unit: 'Stück', plannedQuantity: 30 }
    ]
  },
  {
    id: '2',
    name: 'Kleiner Markt',
    description: 'Für kleinere Märkte unter der Woche',
    lastUsed: '2025-11-28',
    lineItems: [
      { productId: '1', productName: 'Alpkäse mild', unit: 'kg', plannedQuantity: 2 },
      { productId: '6', productName: 'Ziegenkäse frisch', unit: 'Stück', plannedQuantity: 8 }
    ]
  }
]

// Mock Stock Items
export const mockStockItems: StockItem[] = [
  { productId: '1', productName: 'Alpkäse mild', unit: 'kg', totalStock: 45, currentStock: 32, lastUpdated: '2025-12-05' },
  { productId: '2', productName: 'Alpkäse würzig', unit: 'kg', totalStock: 38, currentStock: 28, lastUpdated: '2025-12-05' },
  { productId: '3', productName: 'Bergkäse 12 Monate', unit: 'kg', totalStock: 25, currentStock: 18, lastUpdated: '2025-12-04' },
  { productId: '4', productName: 'Bergkäse 24 Monate', unit: 'kg', totalStock: 15, currentStock: 12, lastUpdated: '2025-12-04' },
  { productId: '5', productName: 'Heumilchkäse', unit: 'kg', totalStock: 20, currentStock: 15, lastUpdated: '2025-12-03' },
  { productId: '6', productName: 'Ziegenkäse frisch', unit: 'Stück', totalStock: 50, currentStock: 35, lastUpdated: '2025-12-05' },
  { productId: '7', productName: 'Ziegenkäse gereift', unit: 'Stück', totalStock: 30, currentStock: 22, lastUpdated: '2025-12-04' },
  { productId: '8', productName: 'Butter 250g', unit: 'Stück', totalStock: 100, currentStock: 65, lastUpdated: '2025-12-05' }
]

