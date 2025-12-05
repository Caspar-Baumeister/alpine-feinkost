'use client'

import { ReactNode } from 'react'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { AdminShell } from '@/components/admin-shell'
import { Loader2 } from 'lucide-react'

interface AdminShellWrapperProps {
  children: ReactNode
}

export function AdminShellWrapper({ children }: AdminShellWrapperProps) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return <AdminShell user={user}>{children}</AdminShell>
}

