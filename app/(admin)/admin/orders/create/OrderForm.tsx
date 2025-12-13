'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  CalendarDays,
  Plus,
  Trash2,
  FileText,
  Save,
  Loader2
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Product,
  OrderTemplate,
  OrderItem,
  createOrder,
  createOrderTemplate
} from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { cn } from '@/lib/utils'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { PageHeader } from '@/components/page-header'

interface OrderFormProps {
  products: Product[]
  templates: OrderTemplate[]
}

interface LineItem {
  id: string
  productId: string
  productName: string
  unitType: Product['unitType']
  unitLabel: string
  orderedQuantity: number
  note: string
}

export function OrderForm({ products, templates }: OrderFormProps) {
  const t = useTranslations('orders')
  const tActions = useTranslations('actions')
  const router = useRouter()
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const { user: currentUser } = useCurrentUser()

  const getProductName = (product: Product) => {
    if (locale === 'de') {
      return product.nameDe || product.name || product.nameEn || ''
    }
    return product.nameEn || product.nameDe || product.name || ''
  }

  // Form state
  const [orderName, setOrderName] = useState<string>('')
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date())
  const [expectedArrivalDate, setExpectedArrivalDate] = useState<Date | undefined>(undefined)
  const [note, setNote] = useState<string>('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Product selector state
  const [productSearchOpen, setProductSearchOpen] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setLineItems(
        template.items.map((item, idx) => ({
          id: `${Date.now()}-${idx}`,
          productId: item.productId,
          productName: item.productName,
          unitType: item.unitType,
          unitLabel: getUnitLabel(item.unitType, locale),
          orderedQuantity: item.defaultQuantity,
          note: item.note
        }))
      )
      if (template.note) {
        setNote(template.note)
      }
    }
    setSelectedTemplateId(templateId)
  }

  const addLineItem = (product: Product) => {
    const newItem: LineItem = {
      id: `${Date.now()}`,
      productId: product.id,
      productName: getProductName(product),
      unitType: product.unitType,
      unitLabel: getUnitLabel(product.unitType, locale),
      orderedQuantity: 1,
      note: ''
    }
    setLineItems([...lineItems, newItem])
    setProductSearchOpen(false)
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    if (!currentUser || !expectedArrivalDate) return

    setIsSaving(true)

    try {
      // Convert line items to OrderItem format
      const items: OrderItem[] = lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitType: item.unitType,
        unitLabel: item.unitLabel,
        orderedQuantity: item.orderedQuantity || 0,
        receivedQuantity: null,
        note: item.note
      }))

      // Create the order
      await createOrder({
        name: orderName || null,
        orderDate: orderDate || new Date(),
        expectedArrivalDate,
        status: 'open',
        note,
        templateId: selectedTemplateId || null,
        createdBy: currentUser.uid,
        items
      })

      // Optionally save as template
      if (saveAsTemplate && templateName) {
        await createOrderTemplate({
          name: templateName,
          description: '',
          note,
          createdBy: currentUser.uid,
          items: lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitType: item.unitType,
            unitLabel: item.unitLabel,
            defaultQuantity: item.orderedQuantity,
            note: item.note
          }))
        })
      }

      router.push('/admin/orders')
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('createOrder')} description={t('description')} />

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('form.name')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Name */}
            <div className="space-y-2">
              <Label>{t('form.name')}</Label>
              <Input
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
              />
            </div>

            {/* Order Date */}
            <div className="space-y-2">
              <Label>{t('form.orderDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !orderDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {orderDate ? (
                      format(orderDate, 'PPP', { locale: dateLocale })
                    ) : (
                      locale === 'de' ? 'Datum wählen' : 'Select date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    onSelect={setOrderDate}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expected Arrival Date */}
            <div className="space-y-2">
              <Label>{t('form.expectedArrivalDate')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expectedArrivalDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {expectedArrivalDate ? (
                      format(expectedArrivalDate, 'PPP', { locale: dateLocale })
                    ) : (
                      locale === 'de' ? 'Datum wählen' : 'Select date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedArrivalDate}
                    onSelect={setExpectedArrivalDate}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>{t('form.startFromTemplate')}</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.startFromTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{locale === 'de' ? 'Keine Vorlage' : 'No template'}</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>{t('form.note')}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={locale === 'de' ? 'Optionale Notiz...' : 'Optional note...'}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('form.products')}</CardTitle>
            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('form.addLine')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                  <CommandInput placeholder={locale === 'de' ? 'Produkt suchen...' : 'Search product...'} />
                  <CommandList>
                    <CommandEmpty>
                      {locale === 'de' ? 'Keine Produkte gefunden' : 'No products found'}
                    </CommandEmpty>
                    <CommandGroup>
                      {products
                        .filter((p) => p.isActive)
                        .filter((p) => !lineItems.some((item) => item.productId === p.id))
                        .map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => addLineItem(product)}
                          >
                            {getProductName(product)}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {locale === 'de' ? 'Keine Produkte hinzugefügt' : 'No products added'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('form.product')}</TableHead>
                    <TableHead>{t('form.orderedQuantity')}</TableHead>
                    <TableHead>{t('form.lineNote')}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.orderedQuantity}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                orderedQuantity: parseFloat(e.target.value) || 0
                              })
                            }
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">{item.unitLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.note}
                          onChange={(e) => updateLineItem(item.id, { note: e.target.value })}
                          placeholder={locale === 'de' ? 'Notiz...' : 'Note...'}
                          className="max-w-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save as Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('form.saveAsTemplate')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveAsTemplate"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="saveAsTemplate" className="cursor-pointer">
              {t('form.saveAsTemplate')}
            </Label>
          </div>
          {saveAsTemplate && (
            <div className="space-y-2">
              <Label>{t('form.templateName')}</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t('form.templateName')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          {tActions('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || !expectedArrivalDate || lineItems.length === 0}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tActions('save')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {tActions('create')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

