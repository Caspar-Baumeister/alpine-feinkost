import { Label } from '@/lib/firestore'

export function getLabelDisplayName(label: Label, locale: string) {
  return locale === 'de' ? label.nameDe : label.nameEn
}

