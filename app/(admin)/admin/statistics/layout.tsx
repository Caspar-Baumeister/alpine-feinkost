'use client'

import { ReactNode } from 'react'
import { SuperadminAuthGuard } from '@/components/auth'

export default function StatisticsLayout({ children }: { children: ReactNode }) {
  return <SuperadminAuthGuard>{children}</SuperadminAuthGuard>
}

