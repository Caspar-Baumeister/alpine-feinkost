import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AppUser, AppRole } from './types'

const COLLECTION = 'users'

function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

function docToUser(id: string, data: Record<string, unknown>): AppUser {
  return {
    uid: id,
    email: data.email as string,
    displayName: data.displayName as string,
    role: data.role as AppRole,
    locale: (data.locale as 'de' | 'en') || 'de',
    active: data.active as boolean,
    createdAt: timestampToDate(data.createdAt as Timestamp | null),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | null)
  }
}

export async function getUserByUid(uid: string): Promise<AppUser | null> {
  const docRef = doc(db, COLLECTION, uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToUser(docSnap.id, docSnap.data())
}

export async function listUsers(): Promise<AppUser[]> {
  const colRef = collection(db, COLLECTION)
  const snapshot = await getDocs(colRef)

  return snapshot.docs.map((d) => docToUser(d.id, d.data()))
}

export async function listActiveUsers(): Promise<AppUser[]> {
  const colRef = collection(db, COLLECTION)
  const snapshot = await getDocs(colRef)

  return snapshot.docs
    .map((d) => docToUser(d.id, d.data()))
    .filter((user) => user.active)
}

export async function upsertUser(user: Omit<AppUser, 'createdAt' | 'updatedAt'>): Promise<void> {
  const docRef = doc(db, COLLECTION, user.uid)
  const existing = await getDoc(docRef)

  if (existing.exists()) {
    await updateDoc(docRef, {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      locale: user.locale,
      active: user.active,
      updatedAt: serverTimestamp()
    })
  } else {
    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      locale: user.locale,
      active: user.active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
}

export async function setUserRole(uid: string, role: AppRole): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp()
  })
}

export async function deactivateUser(uid: string): Promise<void> {
  const docRef = doc(db, COLLECTION, uid)
  await updateDoc(docRef, {
    active: false,
    updatedAt: serverTimestamp()
  })
}

