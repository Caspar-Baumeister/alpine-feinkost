import { Product } from '@/lib/firestore'

export function getProductNameForLocale(product: Product, locale: string) {
  if (locale === 'de') {
    return product.nameDe || product.name || ''
  }

  return product.nameEn || product.nameDe || product.name || ''
}

