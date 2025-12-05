'use client'

import { ReactNode } from 'react'
import { WorkerAuthGuard } from '@/components/auth'
import { WorkerShellWrapper } from './WorkerShellWrapper'

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <WorkerAuthGuard>
      <WorkerShellWrapper>{children}</WorkerShellWrapper>
    </WorkerAuthGuard>
  )
}
