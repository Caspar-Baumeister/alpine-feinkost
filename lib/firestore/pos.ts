import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Pos } from './types'

const COLLECTION = 'pos'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToPos(id: string, data: Record<string, unknown>): Pos {
  return {
    id,
    name: data.name as string,
    location: data.location as string || '',
    notes: data.notes as string || '',
    active: data.active as boolean ?? true,
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function listPos(): Promise<Pos[]> {
  const colRef = collection(db, COLLECTION)
  const q = query(colRef, orderBy('name', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => docToPos(d.id, d.data()))
}

export async function getPos(id: string): Promise<Pos | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToPos(docSnap.id, docSnap.data())
}

export async function createPos(
  data: Omit<Pos, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, COLLECTION)
  const docRef = await addDoc(colRef, {
    name: data.name,
    location: data.location,
    notes: data.notes,
    active: data.active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return docRef.id
}

export async function updatePos(
  id: string,
  data: Partial<Omit<Pos, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

