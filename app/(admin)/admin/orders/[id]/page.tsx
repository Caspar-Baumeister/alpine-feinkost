'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  getOrder,
  confirmOrder,
  updateOrder,
  Order
} from '@/lib/firestore'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { getPublicStorageUrl } from '@/lib/storage/publicUrl'
import { uploadOrderDocumentImage, deleteOrderDocumentImage } from '@/lib/storage/orders'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('orders')
  const tActions = useTranslations('actions')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const { user: currentUser } = useCurrentUser()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFoundState, setNotFoundState] = useState(false)
  const [receivedQuantities, setReceivedQuantities] = useState<Map<string, number>>(new Map())
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date())
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [deliveryDateError, setDeliveryDateError] = useState(false)

  const loadData = async () => {
    try {
      const orderData = await getOrder(id)
      if (!orderData) {
        setNotFoundState(true)
        return
      }

      setOrder(orderData)
      if (orderData.bestelllistePhoto?.storagePath) {
        const url = getPublicStorageUrl(orderData.bestelllistePhoto.storagePath)
        setPhotoPreviewUrl(url)
      } else {
        setPhotoPreviewUrl(null)
      }

      // Initialize received quantities with ordered quantities (or existing received if set)
      const initialQuantities = new Map<string, number>()
      orderData.items.forEach((item) => {
        initialQuantities.set(
          item.productId,
          item.receivedQuantity ?? item.orderedQuantity
        )
      })
      setReceivedQuantities(initialQuantities)
      
      // Initialize note from order
      setNote(orderData.note || '')
    } catch (err) {
      console.error('Failed to load order:', err)
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

  const handleReceivedQuantityChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const newQuantities = new Map(receivedQuantities)
    newQuantities.set(productId, numValue)
    setReceivedQuantities(newQuantities)
  }

  const handleConfirm = async () => {
    if (!order || !currentUser) {
      setError(
        locale === 'de'
          ? 'Keine Berechtigung zum Bestätigen'
          : 'Not authorized to confirm'
      )
      return
    }

    // Validate delivery date
    if (!deliveryDate) {
      setDeliveryDateError(true)
      return
    }

    setIsConfirming(true)
    setError(null)
    setDeliveryDateError(false)

    try {
      const itemsWithReceivedQuantity = Array.from(receivedQuantities.entries()).map(
        ([productId, receivedQuantity]) => ({
          productId,
          receivedQuantity
        })
      )

      await confirmOrder(
        order.id,
        itemsWithReceivedQuantity,
        currentUser.uid,
        deliveryDate,
        deliveryNoteNumber || null,
        note
      )
      router.push('/admin/orders')
    } catch (err) {
      console.error('Failed to confirm order:', err)
      setError(
        err instanceof Error
          ? err.message
          : locale === 'de' ? 'Fehler beim Bestätigen' : 'Failed to confirm'
      )
      setIsConfirming(false)
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !currentUser) return

    const file = event.target.files?.[0]
    if (!file) return

    setIsUpdatingPhoto(true)
    try {
      // Delete previous image if present
      if (order.bestelllistePhoto?.storagePath) {
        await deleteOrderDocumentImage(order.bestelllistePhoto.storagePath)
      }

      const storagePath = await uploadOrderDocumentImage(order.id, file)
      await updateOrder(order.id, {
        bestelllistePhoto: {
          storagePath,
          contentType: file.type || undefined,
          originalFileName: file.name,
          sizeBytes: file.size
        }
      })

      const url = getPublicStorageUrl(storagePath)
      setPhotoPreviewUrl(url)
      setOrder({
        ...order,
        bestelllistePhoto: {
          storagePath,
          contentType: file.type || undefined,
          originalFileName: file.name,
          sizeBytes: file.size
        }
      })
    } catch (error) {
      console.error('Failed to update order document image:', error)
    } finally {
      setIsUpdatingPhoto(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFoundState || !order) {
    notFound()
  }

  const isCompleted = order.status === 'completed'
  const canConfirm = !isCompleted && order.status !== 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              {order.name || `#${order.id.slice(0, 8)}`}
            </h1>
            <Badge variant={order.status === 'completed' ? 'outline' : 'default'}>
              {t(`status.${order.status}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            ID: {order.id}
          </p>
        </div>
      </div>

      {/* Totals summary always visible */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('detail.totalWeightNetto')}
              </p>
              <p className="text-lg font-semibold">
                {order.totalKg.toFixed(2)} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {locale === 'de' ? 'Total (Stück)' : 'Total (pieces)'}
              </p>
              <p className="text-lg font-semibold">
                {order.totalPieces}{' '}
                {locale === 'de' ? 'Stück' : 'pieces'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Completed Badge */}
      {isCompleted && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{t('detail.confirmed')}</span>
          {order.confirmedAt && (
            <span className="text-sm text-muted-foreground ml-auto">
              {format(new Date(order.confirmedAt), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
            </span>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('detail.expectedDeliveryDate')}</p>
                <p className="font-medium">
                  {format(order.orderDate, 'PP', { locale: dateLocale })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('detail.deliveryDate')}</p>
                <p className="font-medium">
                  {format(order.expectedArrivalDate, 'PP', { locale: dateLocale })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.supplierLabel && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.supplier')}</p>
                  <p className="font-medium">{order.supplierLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {order.name && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.deliveryNoteNumber')}</p>
                  <p className="font-medium">{order.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Note */}
      {order.note && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('form.note')}</p>
                <p className="font-medium">{order.note}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('detail.items')}</CardTitle>
        </CardHeader>
        <CardContent>
          {canConfirm && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm">
              {t('detail.checkDescription')}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('form.product')}</TableHead>
                <TableHead className="text-right">{t('detail.ordered')}</TableHead>
                <TableHead className="text-right">{t('detail.received')}</TableHead>
                <TableHead className="text-right">{t('detail.difference')}</TableHead>
                {order.items[0]?.note && <TableHead>{t('form.lineNote')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const receivedQty = receivedQuantities.get(item.productId) ?? item.orderedQuantity
                const difference = receivedQty - item.orderedQuantity
                const unitLabel = getUnitLabel(item.unitType, locale)

                return (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">
                      {item.orderedQuantity} {unitLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      {canConfirm ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={receivedQty}
                            onChange={(e) =>
                              handleReceivedQuantityChange(item.productId, e.target.value)
                            }
                            className="w-24 text-right"
                          />
                          <span className="text-sm text-muted-foreground">{unitLabel}</span>
                        </div>
                      ) : (
                        <span>
                          {item.receivedQuantity ?? receivedQty} {unitLabel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {difference !== 0 ? (
                        <span
                          className={
                            difference > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {difference > 0 ? '+' : ''}
                          {difference} {unitLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {item.note && (
                      <TableCell className="text-sm text-muted-foreground">
                        {item.note}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Action */}
      {canConfirm && (
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{t('detail.checkDelivery')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('detail.checkDescription')}
                </p>
              </div>
              <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('detail.confirmOrder')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('detail.checkDelivery')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Delivery Date - Required */}
                    <div className="space-y-2">
                      <Label className={deliveryDateError ? 'text-destructive' : ''}>
                        {t('detail.deliveryDate')} *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !deliveryDate && 'text-muted-foreground',
                              deliveryDateError && 'border-destructive'
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {deliveryDate ? (
                              format(deliveryDate, 'PPP', { locale: dateLocale })
                            ) : (
                              locale === 'de' ? 'Datum wählen' : 'Select date'
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={deliveryDate}
                            onSelect={(date) => {
                              setDeliveryDate(date)
                              setDeliveryDateError(false)
                            }}
                            locale={dateLocale}
                          />
                        </PopoverContent>
                      </Popover>
                      {deliveryDateError && (
                        <p className="text-xs text-destructive">
                          {t('detail.deliveryDateRequired')}
                        </p>
                      )}
                    </div>

                    {/* Delivery Note Number - Optional */}
                    <div className="space-y-2">
                      <Label>{t('detail.deliveryNoteNumber')}</Label>
                      <Input
                        value={deliveryNoteNumber}
                        onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                        placeholder={t('detail.deliveryNoteNumberPlaceholder')}
                      />
                    </div>

                    {/* Note - Editable */}
                    <div className="space-y-2">
                      <Label>{t('form.note')}</Label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={locale === 'de' ? 'Optionale Notiz...' : 'Optional note...'}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReceiveDialogOpen(false)
                        setDeliveryDateError(false)
                      }}
                    >
                      {tActions('cancel')}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isConfirming}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {locale === 'de' ? 'Bestätigen...' : 'Confirming...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('detail.confirmOrder')}
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bestellliste / Auftrag photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === 'de' ? 'Bestellliste / Auftrag Foto' : 'Order sheet photo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="order-photo">
              {locale === 'de'
                ? 'Foto hochladen oder ersetzen'
                : 'Upload or replace photo'}
            </Label>
            <Input
              id="order-photo"
              type="file"
              accept="image/*"
              disabled={isUpdatingPhoto}
              onChange={handlePhotoChange}
            />
            {isUpdatingPhoto && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {locale === 'de' ? 'Lade Foto hoch…' : 'Uploading photo…'}
              </p>
            )}
          </div>
          {photoPreviewUrl && (
            <div className="mt-2">
              <p className="mb-1 text-xs text-muted-foreground">
                {locale === 'de' ? 'Aktuelles Foto:' : 'Current photo:'}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="focus:outline-none">
                    <img
                      src={photoPreviewUrl}
                      alt="Bestellliste"
                      className="h-40 w-auto rounded-md border object-cover hover:opacity-90 transition"
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 show-close-button">
                  <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="text-sm">
                      {locale === 'de'
                        ? 'Bestellliste / Auftrag'
                        : 'Order sheet'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="px-4 pb-4">
                    <div className="max-h-[80vh] w-full overflow-hidden rounded-md border bg-black flex items-center justify-center">
                      <img
                        src={photoPreviewUrl}
                        alt="Bestellliste"
                        className="max-h-[80vh] w-auto max-w-full object-contain"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

