'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserByUid } from '@/lib/firestore/users'
import { AppUser } from '@/lib/firestore/types'

interface UseCurrentUserResult {
  user: AppUser | null
  firebaseUser: User | null
  isLoading: boolean
  error: Error | null
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (!fbUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const appUser = await getUserByUid(fbUser.uid)
        setUser(appUser)
        setError(null)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch user'))
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { user, firebaseUser, isLoading, error }
}

