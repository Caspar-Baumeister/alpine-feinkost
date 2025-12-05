'use client'

import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RootPage() {
  const router = useRouter()
  const { user, isLoading } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    // Redirect based on role
    if (user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/app')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )
}
