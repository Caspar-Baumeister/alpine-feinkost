import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Label } from './types'

const COLLECTION = 'labels'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToLabel(id: string, data: Record<string, unknown>): Label {
  return {
    id,
    name: data.name as string,
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function listLabels(): Promise<Label[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('name', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToLabel(d.id, d.data()))
}

export async function createLabel(name: string): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = await addDoc(colRef, {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

