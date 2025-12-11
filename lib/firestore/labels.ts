import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  getDocs as getDocsRaw,
  limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Label } from './types'

const COLLECTION = 'labels'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToLabel(id: string, data: Record<string, unknown>): Label {
  const fallbackDescription = (data.description as string) ?? ''
  const descriptionDe = (data.descriptionDe as string) ?? fallbackDescription ?? ''
  const descriptionEn = (data.descriptionEn as string) ?? null

  return {
    id,
    slug: data.slug as string,
    nameEn: data.nameEn as string,
    nameDe: data.nameDe as string,
    descriptionDe,
    descriptionEn,
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function listLabels(): Promise<Label[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('nameEn', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToLabel(d.id, d.data()))
}

export async function getLabelBySlug(slug: string): Promise<Label | null> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, where('slug', '==', slug), limit(1))
  const snapshot = await getDocsRaw(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return docToLabel(doc.id, doc.data())
}

type CreateLabelInput = {
  slug: string
  nameEn: string
  nameDe: string
  descriptionDe?: string | null
  descriptionEn?: string | null
}

export async function createLabel(data: CreateLabelInput): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = await addDoc(colRef, {
    slug: data.slug,
    nameEn: data.nameEn,
    nameDe: data.nameDe,
    descriptionDe: data.descriptionDe ?? '',
    descriptionEn: data.descriptionEn ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

