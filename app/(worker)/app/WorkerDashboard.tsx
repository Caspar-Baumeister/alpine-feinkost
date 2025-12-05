'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { Packlist } from '@/lib/firestore'
import { useLocale } from 'next-intl'

interface WorkerDashboardProps {
  packlists: Packlist[]
}

export function WorkerDashboard({ packlists }: WorkerDashboardProps) {
  const t = useTranslations('worker.dashboard')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS

  // Group packlists by status
  const activePacklists = packlists.filter(
    (p) => p.status === 'open' || p.status === 'currently_selling'
  )
  const historyPacklists = packlists.filter(
    (p) => p.status === 'sold' || p.status === 'completed'
  )

  if (packlists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noPacklists')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active Packlists */}
      {activePacklists.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            {locale === 'de' ? 'Aktiv' : 'Active'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePacklists.map((packlist) => (
              <PacklistCard
                key={packlist.id}
                packlist={packlist}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {historyPacklists.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            {locale === 'de' ? 'Verlauf' : 'History'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historyPacklists.map((packlist) => (
              <PacklistCard
                key={packlist.id}
                packlist={packlist}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PacklistCardProps {
  packlist: Packlist
  dateLocale: Locale
}

function PacklistCard({ packlist, dateLocale }: PacklistCardProps) {
  const isActive = packlist.status === 'open' || packlist.status === 'currently_selling'

  return (
    <Link href={`/app/packlists/${packlist.id}`}>
      <Card className={`transition-colors hover:border-emerald-500/50 ${isActive ? 'border-emerald-500/30' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium truncate">
              {packlist.posName}
            </CardTitle>
            <StatusBadge status={packlist.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(new Date(packlist.date), 'EEEE, d. MMM yyyy', { locale: dateLocale })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{packlist.items.length} Produkte</span>
          </div>

          {isActive && (
            <Button variant="ghost" size="sm" className="w-full mt-2 group">
              {packlist.status === 'open' ? 'Starten' : 'Fortsetzen'}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          {packlist.status === 'sold' && packlist.expectedCash !== null && (
            <div className="pt-2 border-t border-border/50 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Differenz</span>
                <span className={
                  (packlist.difference ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }>
                  {(packlist.difference ?? 0) >= 0 ? '+' : ''}€{(packlist.difference ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
