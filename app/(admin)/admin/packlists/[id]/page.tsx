'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Banknote,
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import {
  getPacklist,
  completePacklist,
  listUsers,
  getPos,
  Packlist,
  AppUser,
  Pos
} from '@/lib/firestore'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminPacklistDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('packlists')
  const tActions = useTranslations('actions')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const { user: currentUser } = useCurrentUser()

  const [packlist, setPacklist] = useState<Packlist | null>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [assignedUsers, setAssignedUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFoundState, setNotFoundState] = useState(false)

  const loadData = async () => {
    try {
      const packlistData = await getPacklist(id)
      if (!packlistData) {
        setNotFoundState(true)
        return
      }

      setPacklist(packlistData)

      // Load POS and assigned users in parallel
      const [posData, usersData] = await Promise.all([
        getPos(packlistData.posId),
        listUsers()
      ])

      setPos(posData)

      // Filter users that are assigned to this packlist
      const assigned = usersData.filter((u) =>
        packlistData.assignedUserIds.includes(u.uid)
      )
      setAssignedUsers(assigned)
    } catch (err) {
      console.error('Failed to load packlist:', err)
      setError(
        err instanceof Error
          ? err.message
          : locale === 'de' ? 'Fehler beim Laden' : 'Failed to load'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleComplete = async () => {
    if (!packlist || !currentUser) {
      setError(
        locale === 'de'
          ? 'Keine Berechtigung zum Abschließen'
          : 'Not authorized to complete'
      )
      return
    }

    setIsCompleting(true)
    setError(null)

    try {
      await completePacklist(packlist.id, currentUser.uid)
      router.push('/admin/packlists')
    } catch (err) {
      console.error('Failed to complete packlist:', err)
      setError(
        err instanceof Error
          ? err.message
          : locale === 'de' ? 'Fehler beim Abschließen' : 'Failed to complete'
      )
      setIsCompleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFoundState || !packlist) {
    notFound()
  }

  // Calculate line item details
  const lineItems = packlist.items.map((item) => {
    const startQty = item.startQuantity ?? item.plannedQuantity
    const endQty = item.endQuantity ?? 0
    const soldQty = startQty - endQty
    const price = item.specialPrice ?? item.basePrice
    const lineTotal = soldQty * price

    return {
      ...item,
      startQty,
      endQty,
      soldQty,
      price,
      lineTotal
    }
  })

  // Calculate totals
  const totalExpected = packlist.changeAmount + lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const reportedCash = packlist.reportedCash ?? 0
  const difference = reportedCash - totalExpected

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{packlist.posName}</h1>
            <StatusBadge status={packlist.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            ID: {packlist.id}
          </p>
        </div>
        {packlist.status === 'sold' && (
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {locale === 'de' ? 'Abschließen' : 'Complete'}
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Completed Badge */}
      {packlist.status === 'completed' && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            {locale === 'de' ? 'Diese Packliste wurde abgeschlossen' : 'This packlist has been completed'}
          </span>
          {packlist.closedAt && (
            <span className="text-sm text-muted-foreground ml-auto">
              {format(new Date(packlist.closedAt), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
            </span>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('columns.date')}</p>
                <p className="font-medium">
                  {format(new Date(packlist.date), 'dd.MM.yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('columns.pos')}</p>
                <p className="font-medium">{pos?.name || packlist.posName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('columns.assignedUsers')}</p>
                <p className="font-medium">
                  {assignedUsers.length > 0
                    ? assignedUsers.map((u) => u.displayName).join(', ')
                    : '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('form.changeAmount')}</p>
                <p className="font-medium">€{packlist.changeAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      {packlist.note && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('form.note')}</p>
                <p className="font-medium">{packlist.note}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worker Note */}
      {packlist.workerNote && (
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  {locale === 'de' ? 'Notiz vom Mitarbeiter' : 'Note from Worker'}
                </p>
                <p className="mt-1">{packlist.workerNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.lineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === 'de' ? 'Produkt' : 'Product'}</TableHead>
                <TableHead>{locale === 'de' ? 'Einheit' : 'Unit'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Geplant' : 'Planned'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Start' : 'Start'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Ende' : 'End'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Verkauft' : 'Sold'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Preis' : 'Price'}</TableHead>
                <TableHead className="text-right">{locale === 'de' ? 'Gesamt' : 'Total'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => {
                const unitLabel = getUnitLabel(item.unitType, locale)
                return (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{unitLabel}</TableCell>
                    <TableCell className="text-right">{item.plannedQuantity}</TableCell>
                    <TableCell className="text-right">
                      {item.startQuantity !== null ? item.startQuantity : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.endQuantity !== null ? item.endQuantity : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.soldQty}</TableCell>
                    <TableCell className="text-right">
                      €{item.price.toFixed(2)}
                      {item.specialPrice && (
                        <span className="text-xs text-muted-foreground ml-1">(S)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">€{item.lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-medium">
                  {t('form.changeAmount')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  €{packlist.changeAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === 'de' ? 'Zusammenfassung' : 'Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">
                {t('columns.expectedCash')}
              </p>
              <p className="text-2xl font-bold">€{totalExpected.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">
                {t('columns.reportedCash')}
              </p>
              <p className="text-2xl font-bold">€{reportedCash.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-lg ${
              difference >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">
                {t('columns.difference')}
              </p>
              <p className={`text-2xl font-bold ${
                difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {difference >= 0 ? '+' : ''}€{difference.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action for sold packlists */}
      {packlist.status === 'sold' && (
        <Card className="border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="font-medium">
                    {locale === 'de' ? 'Warte auf Überprüfung' : 'Awaiting Review'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'de'
                      ? 'Überprüfen Sie die Daten und schließen Sie die Packliste ab'
                      : 'Review the data and complete the packlist'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {locale === 'de' ? 'Packliste abschließen' : 'Complete Packlist'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

