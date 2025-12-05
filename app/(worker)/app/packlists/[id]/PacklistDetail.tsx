'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  CalendarDays,
  MapPin,
  Users,
  Banknote,
  FileText,
  ArrowLeft,
  Play,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
import {
  Packlist,
  startSellingPacklist,
  finishSellingPacklist
} from '@/lib/firestore'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

interface PacklistDetailProps {
  packlist: Packlist
  onUpdate: () => void
}

interface LineItemState {
  productId: string
  startQuantity: number
  endQuantity: number
}

export function PacklistDetail({ packlist, onUpdate }: PacklistDetailProps) {
  const t = useTranslations('worker.packlist')
  const tPacklists = useTranslations('packlists')
  const router = useRouter()
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS

  // Local UI state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lineItemStates, setLineItemStates] = useState<LineItemState[]>(
    packlist.items.map((item) => ({
      productId: item.productId,
      startQuantity: item.startQuantity ?? item.plannedQuantity,
      endQuantity: item.endQuantity ?? 0
    }))
  )
  const [finalCash, setFinalCash] = useState<string>(
    packlist.reportedCash?.toString() || ''
  )

  const updateLineItemState = (
    productId: string,
    field: 'startQuantity' | 'endQuantity',
    value: number
  ) => {
    setLineItemStates((states) =>
      states.map((state) =>
        state.productId === productId ? { ...state, [field]: value } : state
      )
    )
  }

  const getStateForItem = (productId: string) => {
    return (
      lineItemStates.find((s) => s.productId === productId) || {
        startQuantity: 0,
        endQuantity: 0
      }
    )
  }

  const handleStartSelling = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Validate quantities
      const hasNegative = lineItemStates.some((s) => s.startQuantity < 0)
      if (hasNegative) {
        setError(locale === 'de' ? 'Mengen dürfen nicht negativ sein' : 'Quantities cannot be negative')
        setIsSaving(false)
        return
      }

      // Call the stock-safe helper
      await startSellingPacklist(
        packlist.id,
        lineItemStates.map((s) => ({
          productId: s.productId,
          startQuantity: s.startQuantity
        }))
      )

      onUpdate()
    } catch (err) {
      console.error('Failed to start selling:', err)
      setError(
        err instanceof Error
          ? err.message
          : locale === 'de' ? 'Fehler beim Starten des Verkaufs' : 'Failed to start selling'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinishSelling = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Validate quantities
      const hasNegative = lineItemStates.some((s) => s.endQuantity < 0)
      if (hasNegative) {
        setError(locale === 'de' ? 'Mengen dürfen nicht negativ sein' : 'Quantities cannot be negative')
        setIsSaving(false)
        return
      }

      const reportedCash = parseFloat(finalCash) || 0
      if (reportedCash < 0) {
        setError(locale === 'de' ? 'Bargeldbetrag darf nicht negativ sein' : 'Cash amount cannot be negative')
        setIsSaving(false)
        return
      }

      // Call the stock-safe helper
      await finishSellingPacklist(
        packlist.id,
        lineItemStates.map((s) => ({
          productId: s.productId,
          endQuantity: s.endQuantity
        })),
        reportedCash
      )

      onUpdate()
    } catch (err) {
      console.error('Failed to finish selling:', err)
      setError(
        err instanceof Error
          ? err.message
          : locale === 'de' ? 'Fehler beim Beenden des Verkaufs' : 'Failed to finish selling'
      )
    } finally {
      setIsSaving(false)
    }
  }

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
            {packlist.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'de' ? 'Datum' : 'Date'}
                </p>
                <p className="font-medium">
                  {format(new Date(packlist.date), 'EEEE, d. MMMM yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {tPacklists('columns.pos')}
                </p>
                <p className="font-medium">{packlist.posName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'de' ? 'Zugewiesen' : 'Assigned'}
                </p>
                <p className="font-medium">
                  {packlist.assignedUserIds.length} {locale === 'de' ? 'Benutzer' : 'Users'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {tPacklists('form.changeAmount')}
                </p>
                <p className="font-medium">€{packlist.changeAmount.toFixed(2)}</p>
              </div>
            </div>
            {packlist.note && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {tPacklists('form.note')}
                  </p>
                  <p className="font-medium">{packlist.note}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Tabs */}
      <Tabs
        defaultValue={packlist.status === 'open' ? 'before' : 'after'}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="before" disabled={packlist.status !== 'open'}>
            {t('beforeSelling')}
          </TabsTrigger>
          <TabsTrigger value="after" disabled={packlist.status === 'open'}>
            {t('afterSelling')}
          </TabsTrigger>
        </TabsList>

        {/* Before Selling - Checklist */}
        <TabsContent value="before">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('beforeSelling')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'de' ? 'Produkt' : 'Product'}</TableHead>
                    <TableHead className="text-right">
                      {locale === 'de' ? 'Geplant' : 'Planned'}
                    </TableHead>
                    <TableHead className="text-right w-[150px]">
                      {t('actualQuantity')}
                    </TableHead>
                    <TableHead>{locale === 'de' ? 'Einheit' : 'Unit'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packlist.items.map((item) => {
                    const state = getStateForItem(item.productId)
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.plannedQuantity}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={state.startQuantity}
                            onChange={(e) =>
                              updateLineItemState(
                                item.productId,
                                'startQuantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                            disabled={packlist.status !== 'open' || isSaving}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.unitLabel}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {packlist.status === 'open' && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleStartSelling}
                    size="lg"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {t('confirmStart')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* After Selling */}
        <TabsContent value="after">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('afterSelling')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'de' ? 'Produkt' : 'Product'}</TableHead>
                    <TableHead className="text-right">
                      {locale === 'de' ? 'Anfang' : 'Start'}
                    </TableHead>
                    <TableHead className="text-right w-[150px]">
                      {t('remainingQuantity')}
                    </TableHead>
                    <TableHead>{locale === 'de' ? 'Einheit' : 'Unit'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packlist.items.map((item) => {
                    const state = getStateForItem(item.productId)
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.startQuantity ?? item.plannedQuantity}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={state.endQuantity}
                            onChange={(e) =>
                              updateLineItemState(
                                item.productId,
                                'endQuantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                            disabled={packlist.status !== 'currently_selling' || isSaving}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.unitLabel}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Cash Amount */}
              <div className="space-y-2">
                <Label htmlFor="finalCash">{t('finalCash')}</Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                  <Input
                    id="finalCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalCash}
                    onChange={(e) => setFinalCash(e.target.value)}
                    className="pl-8 text-lg"
                    placeholder="0.00"
                    disabled={packlist.status !== 'currently_selling' || isSaving}
                  />
                </div>
              </div>

              {packlist.status === 'currently_selling' && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleFinishSelling}
                    size="lg"
                    disabled={!finalCash || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t('confirmEnd')}
                  </Button>
                </div>
              )}

              {(packlist.status === 'sold' || packlist.status === 'completed') && (
                <div className={`rounded-lg p-4 text-center ${
                  packlist.status === 'completed'
                    ? 'bg-blue-500/10 border border-blue-500/20'
                    : 'bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                    packlist.status === 'completed' ? 'text-blue-500' : 'text-emerald-500'
                  }`} />
                  <p className={`font-medium ${
                    packlist.status === 'completed' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {packlist.status === 'completed'
                      ? (locale === 'de' ? 'Abgeschlossen' : 'Completed')
                      : (locale === 'de' ? 'Verkauf abgeschlossen' : 'Selling finished')
                    }
                  </p>
                  {packlist.status === 'sold' && (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'de' ? 'Warte auf Überprüfung durch Admin' : 'Waiting for admin review'}
                    </p>
                  )}
                  {packlist.expectedCash !== null && packlist.reportedCash !== null && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {locale === 'de' ? 'Erwartet' : 'Expected'}
                        </p>
                        <p className="font-medium">€{packlist.expectedCash.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {locale === 'de' ? 'Gemeldet' : 'Reported'}
                        </p>
                        <p className="font-medium">€{packlist.reportedCash.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {locale === 'de' ? 'Differenz' : 'Difference'}
                        </p>
                        <p className={`font-medium ${
                          (packlist.difference ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {(packlist.difference ?? 0) >= 0 ? '+' : ''}€{(packlist.difference ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
