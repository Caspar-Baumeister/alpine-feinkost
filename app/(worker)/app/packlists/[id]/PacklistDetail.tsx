'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  CalendarDays,
  MapPin,
  Users,
  Banknote,
  FileText,
  ArrowLeft,
  Play,
  CheckCircle,
  Loader2
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
import { Packlist, PacklistItem, updatePacklist } from '@/lib/firestore'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

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
  const tActions = useTranslations('actions')
  const router = useRouter()

  // Local UI state
  const [isSaving, setIsSaving] = useState(false)
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

    try {
      // Update items with start quantities
      const updatedItems: PacklistItem[] = packlist.items.map((item) => {
        const state = getStateForItem(item.productId)
        return {
          ...item,
          startQuantity: state.startQuantity
        }
      })

      await updatePacklist(packlist.id, {
        status: 'currently_selling',
        items: updatedItems
      })

      onUpdate()
    } catch (error) {
      console.error('Failed to start selling:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinishSelling = async () => {
    setIsSaving(true)

    try {
      // Update items with end quantities
      const updatedItems: PacklistItem[] = packlist.items.map((item) => {
        const state = getStateForItem(item.productId)
        return {
          ...item,
          endQuantity: state.endQuantity
        }
      })

      // Calculate expected cash based on sold quantities
      let expectedCash = packlist.changeAmount
      updatedItems.forEach((item) => {
        const startQty = item.startQuantity ?? item.plannedQuantity
        const endQty = item.endQuantity ?? 0
        const soldQty = startQty - endQty
        const price = item.specialPrice ?? item.basePrice
        expectedCash += soldQty * price
      })

      const reportedCash = parseFloat(finalCash) || 0
      const difference = reportedCash - expectedCash

      await updatePacklist(packlist.id, {
        status: 'sold',
        items: updatedItems,
        reportedCash,
        expectedCash,
        difference,
        closedAt: new Date()
      })

      onUpdate()
    } catch (error) {
      console.error('Failed to finish selling:', error)
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
                <p className="text-sm text-muted-foreground">Datum</p>
                <p className="font-medium">
                  {format(new Date(packlist.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Verkaufsstelle</p>
                <p className="font-medium">{packlist.posName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Zugewiesen</p>
                <p className="font-medium">
                  {packlist.assignedUserIds.length} Benutzer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Wechselgeld</p>
                <p className="font-medium">€{packlist.changeAmount}</p>
              </div>
            </div>
            {packlist.note && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Notiz</p>
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
                    <TableHead>Produkt</TableHead>
                    <TableHead className="text-right">Geplant</TableHead>
                    <TableHead className="text-right w-[150px]">
                      {t('actualQuantity')}
                    </TableHead>
                    <TableHead>Einheit</TableHead>
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
                    <TableHead>Produkt</TableHead>
                    <TableHead className="text-right">Anfang</TableHead>
                    <TableHead className="text-right w-[150px]">
                      {t('remainingQuantity')}
                    </TableHead>
                    <TableHead>Einheit</TableHead>
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

              {packlist.status === 'sold' && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium text-emerald-400">
                    Verkauf abgeschlossen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Warte auf Überprüfung durch Admin
                  </p>
                  {packlist.expectedCash !== null && packlist.reportedCash !== null && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Erwartet</p>
                        <p className="font-medium">€{packlist.expectedCash.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gemeldet</p>
                        <p className="font-medium">€{packlist.reportedCash.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Differenz</p>
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
