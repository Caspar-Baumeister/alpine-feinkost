import { Label } from '@/lib/firestore'

export function getLabelDisplayName(label: Label, locale: string) {
  if (locale === 'de') return label.nameDe
  return label.nameEn || label.nameDe
}

