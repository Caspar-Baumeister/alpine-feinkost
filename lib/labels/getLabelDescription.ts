import { Label } from '@/lib/firestore'

export function getLabelDescription(label: Label, locale: string) {
  if (locale === 'de') {
    if (label.descriptionDe) return label.descriptionDe
    return label.descriptionEn || ''
  }

  if (label.descriptionEn) return label.descriptionEn
  return label.descriptionDe || ''
}

