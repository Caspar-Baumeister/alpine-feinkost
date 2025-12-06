'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, ShieldX } from 'lucide-react'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SuperadminAuthGuardProps {
  children: ReactNode
}

export function SuperadminAuthGuard({ children }: SuperadminAuthGuardProps) {
  const router = useRouter()
  const t = useTranslations('accessDenied')
  const { user, firebaseUser, isLoading, error } = useCurrentUser()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return

    // If not authenticated, redirect to login
    if (!firebaseUser && !hasRedirected) {
      setHasRedirected(true)
      router.replace('/login')
    }
  }, [firebaseUser, isLoading, router, hasRedirected])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show loading while redirecting
  if (!firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Firebase user exists but no Firestore user data yet - still loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
          {error && (
            <p className="text-sm text-destructive">
              Error: {error.message}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Only superadmin can access
  if (user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t('title')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('message')}
                </p>
              </div>
              <Button onClick={() => router.replace('/admin')} variant="outline">
                {t('goToAdmin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated and correct role
  return <>{children}</>
}

