'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PacklistStatus = 'open' | 'currently_selling' | 'sold' | 'completed'
type ActiveStatus = 'active' | 'inactive'

interface StatusBadgeProps {
  status: PacklistStatus | ActiveStatus
  className?: string
}

const statusStyles: Record<PacklistStatus | ActiveStatus, string> = {
  open: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  currently_selling: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  sold: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  completed: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  inactive: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
}

const statusTranslationKeys: Record<PacklistStatus | ActiveStatus, string> = {
  open: 'status.open',
  currently_selling: 'status.currentlySelling',
  sold: 'status.sold',
  completed: 'status.completed',
  active: 'status.active',
  inactive: 'status.inactive'
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations()

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', statusStyles[status], className)}
    >
      {t(statusTranslationKeys[status])}
    </Badge>
  )
}
