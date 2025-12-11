import { Product } from '@/lib/firestore'

function defaultUnitLabel(unitType: Product['unitType'], locale: string) {
  if (unitType === 'piece') {
    return locale === 'de' ? 'Stück' : 'piece'
  }
  return 'kg'
}

export function getUnitLabelForLocale(product: Product, locale: string) {
  if (product.unitLabel) return product.unitLabel
  return defaultUnitLabel(product.unitType, locale)
}

