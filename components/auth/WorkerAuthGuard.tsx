'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldX } from 'lucide-react'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WorkerAuthGuardProps {
  children: ReactNode
}

export function WorkerAuthGuard({ children }: WorkerAuthGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useCurrentUser()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

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

  // Not authenticated
  if (!user) {
    return null // Will redirect to login
  }

  // Wrong role - workers only (admins can also access worker view)
  if (user.role !== 'worker' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You don&apos;t have permission to access this area.
                </p>
              </div>
              <Button onClick={() => router.push('/login')} variant="outline">
                Back to Login
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

