'use client'

import { ReactNode } from 'react'
import { SuperadminAuthGuard } from '@/components/auth'

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <SuperadminAuthGuard>{children}</SuperadminAuthGuard>
}

