import { Product } from '@/lib/firestore'
import { ProductUnitType } from '@/lib/firestore/types'

const UNIT_LABELS: Record<'de' | 'en', Partial<Record<ProductUnitType | string, string>>> = {
  de: {
    piece: 'Stück',
    weight: 'kg',
    kg: 'kg',
    g: 'g',
    ml: 'ml'
  },
  en: {
    piece: 'piece',
    weight: 'kg',
    kg: 'kg',
    g: 'g',
    ml: 'ml'
  }
}

export function getUnitLabel(unitType: ProductUnitType | string, locale: string) {
  const language = locale === 'de' ? 'de' : 'en'
  const label = UNIT_LABELS[language][unitType]
  if (label) return label
  return unitType
}

export function getUnitLabelForLocale(
  product: Pick<Product, 'unitType'> & { unitLabel?: string | null },
  locale: string
) {
  return getUnitLabel(product.unitType, locale)
}

