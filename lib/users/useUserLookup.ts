'use client'

import { AppUser, listUsers } from '@/lib/firestore'
import { useEffect, useMemo, useState } from 'react'

export function useUserLookup() {
    const [users, setUsers] = useState<AppUser[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const loadUsers = async () => {
            try {
                const fetchedUsers = await listUsers()
                if (isMounted) {
                    setUsers(fetchedUsers)
                }
            } catch (error) {
                console.error('Failed to load users for lookup', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadUsers()

        return () => {
            isMounted = false
        }
    }, [])

    const userMap = useMemo(() => {
        const map = new Map<string, AppUser>()
        users.forEach((user) => map.set(user.uid, user))
        return map
    }, [users])

    const getDisplayName = (userId?: string | null) => {
        if (!userId) return null
        const user = userMap.get(userId)
        return user?.displayName || user?.email || null
    }

    return {
        users,
        userMap,
        isLoading,
        getDisplayName
    }
}

