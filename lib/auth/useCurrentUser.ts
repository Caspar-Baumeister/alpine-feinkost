'use client'

import { auth } from '@/lib/firebase'
import { AppUser } from '@/lib/firestore/types'
import { getUserByUid } from '@/lib/firestore/users'
import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface UseCurrentUserResult {
    user: AppUser | null
    firebaseUser: User | null
    isLoading: boolean
    error: Error | null
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

export function useCurrentUser(): UseCurrentUserResult {
    const [user, setUser] = useState<AppUser | null>(null)
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const router = useRouter()

    const fetchUserData = useCallback(async (fbUser: User | null) => {
        if (!fbUser) {
            setUser(null)
            setFirebaseUser(null)
            setIsLoading(false)
            return
        }

        setFirebaseUser(fbUser)

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
    }, [])

    const refreshUser = useCallback(async () => {
        if (firebaseUser) {
            setIsLoading(true)
            await fetchUserData(firebaseUser)
        }
    }, [firebaseUser, fetchUserData])

    const signOut = useCallback(async () => {
        try {
            setIsLoading(true)
            await firebaseSignOut(auth)
            setUser(null)
            setFirebaseUser(null)
            setError(null)
            router.push('/login')
        } catch (err) {
            console.error('Error signing out:', err)
            setError(err instanceof Error ? err : new Error('Failed to sign out'))
        } finally {
            setIsLoading(false)
        }
    }, [router])

    useEffect(() => {
        let isMounted = true

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (!isMounted) return

            if (!fbUser) {
                setUser(null)
                setFirebaseUser(null)
                setIsLoading(false)
                return
            }

            setFirebaseUser(fbUser)

            try {
                const appUser = await getUserByUid(fbUser.uid)
                if (isMounted) {
                    setUser(appUser)
                    setError(null)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching user data:', err)
                    setError(err instanceof Error ? err : new Error('Failed to fetch user'))
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        })

        return () => {
            isMounted = false
            unsubscribe()
        }
    }, [])

    return { user, firebaseUser, isLoading, error, signOut, refreshUser }
}
