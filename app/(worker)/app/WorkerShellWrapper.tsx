'use client'

import { ReactNode } from 'react'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { WorkerShell } from '@/components/worker-shell'
import { Loader2 } from 'lucide-react'

interface WorkerShellWrapperProps {
  children: ReactNode
}

export function WorkerShellWrapper({ children }: WorkerShellWrapperProps) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return <WorkerShell user={user}>{children}</WorkerShell>
}

