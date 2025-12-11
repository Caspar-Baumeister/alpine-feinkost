import { listLabels } from '@/lib/firestore/labels'
import { listProducts } from '@/lib/firestore/products'
import { Product, Label } from '@/lib/firestore'
import { mockProducts } from '@/lib/mock-data'

function mapMockProducts(): Product[] {
  return mockProducts.map((p, idx) => ({
    id: p.id || `mock-${idx}`,
    name: p.name,
    nameDe: p.name,
    nameEn: p.name,
    sku: '',
    labels: [],
  unitType: p.unit === 'weight' ? 'kg' : p.unit === 'piece' ? 'piece' : p.unit,
    basePrice: p.basePrice,
    description: p.description || '',
    descriptionDe: p.description || '',
    descriptionEn: p.description || '',
  imagePath: null,
  imagePaths: [],
    isActive: p.active,
    totalStock: 0,
    currentStock: 0,
    createdAt: null,
    updatedAt: null
  }))
}

export type PublicCatalog = {
  products: Product[]
  labels: Label[]
  isFallback: boolean
}

export async function getPublicCatalog(): Promise<PublicCatalog> {
  try {
    const [products, labels] = await Promise.all([listProducts(), listLabels()])
    return { products, labels, isFallback: false }
  } catch (error) {
    console.error('Public catalog fetch failed, using fallback data', error)
    const fallbackProducts = mapMockProducts()
    return { products: fallbackProducts, labels: [], isFallback: true }
  }
}

