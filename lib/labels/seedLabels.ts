import { createLabel, getLabelBySlug } from '@/lib/firestore'
import { slugifyLabel } from '@/lib/labels/slugify'

type RawLabel =
  | string
  | {
      slug?: string
      name?: string
      nameEn?: string
      nameDe?: string
      description?: string
      descriptionDe?: string | null
      descriptionEn?: string | null
    }

type NormalizedLabel = {
  slug: string
  nameEn: string
  nameDe: string
  descriptionDe: string
  descriptionEn: string | null
}

function normalizeLabel(entry: RawLabel): NormalizedLabel | null {
  if (typeof entry === 'string') {
    const name = entry.trim()
    if (!name) return null
    return {
      slug: slugifyLabel(name),
      nameEn: name,
      nameDe: name,
      descriptionDe: '',
      descriptionEn: null
    }
  }

  const nameEn = (entry.nameEn || entry.name || '').trim()
  const nameDe = (entry.nameDe || entry.name || nameEn).trim()

  if (!nameEn) return null

  const slug = entry.slug ? entry.slug.trim() : slugifyLabel(nameEn)
  const descriptionDe = entry.descriptionDe ?? entry.description ?? ''
  const descriptionEn = entry.descriptionEn ?? null

  return {
    slug,
    nameEn,
    nameDe: nameDe || nameEn,
    descriptionDe: typeof descriptionDe === 'string' ? descriptionDe : '',
    descriptionEn: descriptionEn === null ? null : (descriptionEn || '').trim() || null
  }
}

/**
 * Seed labels from labels.json.
 * Supports both legacy string lists and enriched objects with descriptions.
 * Run from a server context only (e.g. admin action).
 */
export async function seedLabelsFromFile() {
  const raw = (await import('@/labels.json')).default as RawLabel[]
  const normalized = raw
    .map(normalizeLabel)
    .filter(Boolean) as NormalizedLabel[]

  let added = 0
  let skipped = 0

  for (const label of normalized) {
    const existing = await getLabelBySlug(label.slug)
    if (existing) {
      skipped += 1
      continue
    }

    await createLabel({
      slug: label.slug,
      nameEn: label.nameEn,
      nameDe: label.nameDe,
      descriptionDe: label.descriptionDe,
      descriptionEn: label.descriptionEn
    })
    added += 1
  }

  return { added, skipped }
}

