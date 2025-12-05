'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CalendarDays, MapPin, ChevronRight, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { Packlist } from '@/lib/firestore'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface WorkerDashboardProps {
  packlists: Packlist[]
}

export function WorkerDashboard({ packlists }: WorkerDashboardProps) {
  const t = useTranslations('worker.dashboard')

  if (packlists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noPacklists')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {packlists.map((packlist) => (
        <Card key={packlist.id} className="overflow-hidden">
          <CardContent className="p-0">
            <Link
              href={`/app/packlists/${packlist.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{packlist.posName}</h3>
                  <StatusBadge status={packlist.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(packlist.date), 'EEEE, d. MMMM', { locale: de })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {packlist.posName}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {packlist.items.length} Produkte • Wechselgeld: €
                  {packlist.changeAmount}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
