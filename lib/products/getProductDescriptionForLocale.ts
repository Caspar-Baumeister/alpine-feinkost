import { Product } from '@/lib/firestore'

export function getProductDescriptionForLocale(product: Product, locale: string) {
  if (locale === 'de') {
    return product.descriptionDe || ''
  }

  return product.descriptionEn || ''
}

