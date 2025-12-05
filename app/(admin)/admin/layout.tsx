'use client'

import { ReactNode } from 'react'
import { AdminAuthGuard } from '@/components/auth'
import { AdminShellWrapper } from './AdminShellWrapper'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShellWrapper>{children}</AdminShellWrapper>
    </AdminAuthGuard>
  )
}
