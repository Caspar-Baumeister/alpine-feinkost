import { Label, Product } from '@/lib/firestore/types'

// Minimal search index types for client-side filtering
export interface SearchableProduct {
  id: string
  nameDe: string
  nameEn: string | null
  imagePath: string | null
  basePrice: number
  unitType: Product['unitType']
  labels: string[]
}

export interface SearchableLabel {
  slug: string
  nameDe: string
  nameEn: string
}

export interface SearchIndex {
  products: SearchableProduct[]
  labels: SearchableLabel[]
}

// Extract minimal search index from full catalog
export function buildSearchIndex(
  products: Product[],
  labels: Label[]
): SearchIndex {
  const searchableProducts: SearchableProduct[] = products
    .filter((p) => p.isActive)
    .map((p) => ({
      id: p.id,
      nameDe: p.nameDe,
      nameEn: p.nameEn,
      imagePath: p.imagePaths?.[0] ?? p.imagePath ?? null,
      basePrice: p.basePrice,
      unitType: p.unitType,
      labels: p.labels
    }))

  const searchableLabels: SearchableLabel[] = labels.map((l) => ({
    slug: l.slug,
    nameDe: l.nameDe,
    nameEn: l.nameEn
  }))

  return { products: searchableProducts, labels: searchableLabels }
}

export type SearchResultType = 'product' | 'label'

export interface SearchResult {
  type: SearchResultType
  id: string
  name: string
  slug?: string
  imagePath?: string | null
  price?: number
  unitType?: Product['unitType']
  score: number
}

// Score: 3 = exact match, 2 = prefix match, 1 = substring match, 0 = no match
function scoreMatch(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  if (lowerText === lowerQuery) return 3
  if (lowerText.startsWith(lowerQuery)) return 2
  if (lowerText.includes(lowerQuery)) return 1
  return 0
}

export function searchIndex(
  index: SearchIndex,
  query: string,
  locale: 'de' | 'en',
  maxProducts = 8,
  maxLabels = 8
): { products: SearchResult[]; labels: SearchResult[] } {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return { products: [], labels: [] }
  }

  // Search products
  const productResults: SearchResult[] = []
  for (const product of index.products) {
    const primaryName = locale === 'de' ? product.nameDe : (product.nameEn || product.nameDe)
    const secondaryName = locale === 'de' ? product.nameEn : product.nameDe

    const primaryScore = scoreMatch(primaryName, trimmedQuery)
    const secondaryScore = secondaryName ? scoreMatch(secondaryName, trimmedQuery) * 0.8 : 0
    const score = Math.max(primaryScore, secondaryScore)

    if (score > 0) {
      productResults.push({
        type: 'product',
        id: product.id,
        name: primaryName,
        imagePath: product.imagePath,
        price: product.basePrice,
        unitType: product.unitType,
        score
      })
    }
  }

  // Search labels
  const labelResults: SearchResult[] = []
  for (const label of index.labels) {
    const primaryName = locale === 'de' ? label.nameDe : label.nameEn
    const secondaryName = locale === 'de' ? label.nameEn : label.nameDe

    const primaryScore = scoreMatch(primaryName, trimmedQuery)
    const secondaryScore = scoreMatch(secondaryName, trimmedQuery) * 0.8
    const slugScore = scoreMatch(label.slug, trimmedQuery) * 0.6
    const score = Math.max(primaryScore, secondaryScore, slugScore)

    if (score > 0) {
      labelResults.push({
        type: 'label',
        id: label.slug,
        name: primaryName,
        slug: label.slug,
        score
      })
    }
  }

  // Sort by score descending, then by name
  const sortedProducts = productResults
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxProducts)

  const sortedLabels = labelResults
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxLabels)

  return { products: sortedProducts, labels: sortedLabels }
}


