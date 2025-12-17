'use client'

import { useMemo, useState } from 'react'
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
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Badge } from '@/components/ui/badge'
import {
  Product,
  Pos,
  AppUser,
  PacklistTemplate,
  PacklistItem,
  createPacklist,
  createPacklistTemplate
} from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { cn } from '@/lib/utils'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'

interface PacklistFormProps {
  products: Product[]
  posList: Pos[]
  users: AppUser[]
  templates: PacklistTemplate[]
}

interface LineItem {
  id: string
  productId: string
  productName: string
  unitType: Product['unitType']
  unitLabel: string
  basePrice: number
  plannedQuantity: number
  specialPrice: number | null
  note: string
}

export function PacklistForm({
  products,
  posList,
  users,
  templates
}: PacklistFormProps) {
  const t = useTranslations('packlists')
  const tActions = useTranslations('actions')
  const tValidation = useTranslations('common.validation')
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

  // Create a map of productId -> product for easy lookup of currentStock
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  // Form state
  const [selectedPosId, setSelectedPosId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])
  const [changeAmount, setChangeAmount] = useState<string>('100')
  const [note, setNote] = useState<string>('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Product selector state
  const [productSearchOpen, setProductSearchOpen] = useState(false)

  // Validation / error state
  const [posError, setPosError] = useState(false)
  const [userError, setUserError] = useState(false)
  const [templateNameError, setTemplateNameError] = useState(false)
  const [duplicateProductError, setDuplicateProductError] = useState<string | null>(null)

  const selectedPos = posList.find((p) => p.id === selectedPosId)

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR'
    })
    return formatter.format(value)
  }

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
          basePrice: item.basePrice,
          plannedQuantity: item.defaultQuantity,
          specialPrice: item.specialPrice,
          note: item.note
        }))
      )
      if (template.changeAmount) {
        setChangeAmount(template.changeAmount.toString())
      }
    }
    setSelectedTemplateId(templateId)
  }

  const addLineItem = (product: Product) => {
    // Prevent duplicates at state level
    if (lineItems.some((item) => item.productId === product.id)) {
      setDuplicateProductError(
        locale === 'de' ? 'Produkt ist bereits in der Packliste.' : 'Product is already in the pack list.'
      )
      // Optionally: could scroll to existing row here
      return
    }

    const newItem: LineItem = {
      id: `${Date.now()}`,
      productId: product.id,
      productName: getProductName(product),
      unitType: product.unitType,
      unitLabel: getUnitLabel(product.unitType, locale),
      basePrice: product.basePrice,
      plannedQuantity: 1,
      specialPrice: null,
      note: ''
    }
    setLineItems([...lineItems, newItem])
    setDuplicateProductError(null)
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

  const toggleUserAssignment = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId))
    } else {
      setAssignedUserIds([...assignedUserIds, userId])
    }
    setUserError(false)
  }

  // Helper to check if a line item exceeds current stock
  const getStockWarning = (item: LineItem): { exceeds: boolean; available: number } => {
    const product = productsMap.get(item.productId)
    if (!product) return { exceeds: false, available: 0 }
    const available = product.currentStock
    return {
      exceeds: item.plannedQuantity > available,
      available
    }
  }

  // Clip a line item quantity to available stock
  const clipToAvailableStock = (itemId: string) => {
    const item = lineItems.find((i) => i.id === itemId)
    if (!item) return
    const product = productsMap.get(item.productId)
    if (!product) return
    updateLineItem(itemId, { plannedQuantity: product.currentStock })
  }

  const handleSubmit = async () => {
    if (!currentUser || !selectedDate) return

    // Validation
    let hasError = false

    if (!selectedPosId) {
      setPosError(true)
      hasError = true
    }

    if (!assignedUserIds.length) {
      setUserError(true)
      hasError = true
    }

    if (saveAsTemplate && !templateName.trim()) {
      setTemplateNameError(true)
      hasError = true
    }

    // Duplicate safety check
    const productIds = lineItems.map((item) => item.productId)
    const uniqueCount = new Set(productIds).size
    if (uniqueCount !== productIds.length) {
      setDuplicateProductError(
        locale === 'de'
          ? 'Jedes Produkt darf nur einmal in der Packliste vorkommen.'
          : 'Each product may only appear once in the pack list.'
      )
      hasError = true
    }

    if (hasError) return

    setIsSaving(true)

    try {
      // Convert line items to PacklistItem format, normalizing empty/undefined quantities to 0
      const items: PacklistItem[] = lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitType: item.unitType,
        unitLabel: item.unitLabel,
        basePrice: item.basePrice,
        specialPrice: item.specialPrice,
        plannedQuantity: item.plannedQuantity || 0, // Normalize empty to 0
        startQuantity: null,
        endQuantity: null,
        note: item.note
      }))

      // Create the packlist
      await createPacklist(
        {
          posId: selectedPosId,
          posName: selectedPos?.name || '',
          status: 'open',
          date: selectedDate,
          assignedUserIds,
          changeAmount: parseFloat(changeAmount) || 0,
          note,
          workerNote: null,
          templateId: selectedTemplateId || null,
          reportedCash: null,
          expectedCash: null,
          difference: null,
          createdBy: currentUser.uid,
          items
        },
        currentUser.uid
      )

      // Optionally save as template (only if name is provided)
      if (saveAsTemplate && templateName.trim()) {
        await createPacklistTemplate({
          name: templateName.trim(),
          description: '',
          defaultPosId: selectedPosId,
          changeAmount: parseFloat(changeAmount) || null,
          note,
          createdBy: currentUser.uid,
          items: lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitType: item.unitType,
            unitLabel: item.unitLabel,
            basePrice: item.basePrice,
            specialPrice: item.specialPrice,
            defaultQuantity: item.plannedQuantity,
            note: item.note
          }))
        })
      }

      router.push('/admin/packlists')
    } catch (error) {
      console.error('Failed to create packlist:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grundinformationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* POS Selection */}
            <div className="space-y-2">
              <Label className={posError ? 'text-destructive' : ''}>{t('form.selectPos')}</Label>
              <Select
                value={selectedPosId}
                onValueChange={(value) => {
                  setSelectedPosId(value)
                  setPosError(false)
                }}
              >
                <SelectTrigger
                  aria-invalid={posError}
                  aria-describedby={posError ? 'pos-error' : undefined}
                  className={cn(posError && 'border-destructive focus-visible:ring-destructive')}
                >
                  <SelectValue placeholder={t('form.selectPos')} />
                </SelectTrigger>
                <SelectContent>
                  {posList.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {posError && (
                <p id="pos-error" className="text-xs text-destructive">
                  {locale === 'de'
                    ? 'Bitte Verkaufsort auswählen.'
                    : 'Please select a point of sale.'}
                </p>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>{t('form.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'PPP', { locale: dateLocale })
                    ) : (
                      locale === 'de' ? 'Datum wählen' : 'Select date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Change Amount */}
            <div className="space-y-2">
              <Label>{t('form.changeAmount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
                <Input
                  type="number"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Assigned Users */}
            <div className="space-y-2">
              <Label className={userError ? 'text-destructive' : ''}>{t('form.assignUsers')}</Label>
              <div
                className={cn(
                  'flex flex-wrap gap-2 rounded-md border border-transparent p-1',
                  userError && 'border-destructive'
                )}
                aria-invalid={userError}
                aria-describedby={userError ? 'users-error' : undefined}
              >
                {users.map((u) => (
                  <Badge
                    key={u.uid}
                    variant={
                      assignedUserIds.includes(u.uid) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleUserAssignment(u.uid)}
                  >
                    {u.displayName}
                    {assignedUserIds.includes(u.uid) && (
                      <Check className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              {userError && (
                <p id="users-error" className="text-xs text-destructive">
                  {locale === 'de'
                    ? 'Bitte Mitarbeiter auswählen.'
                    : 'Please assign at least one worker.'}
                </p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>{t('form.note')}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optionale Notizen zur Packliste..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">{t('form.lineItems')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* Template Selector */}
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder={t('form.startFromTemplate')} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Product */}
            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <PopoverTrigger asChild>
                <Button className="flex-shrink-0">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('form.addLine')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Produkt suchen..." />
                  <CommandList>
                    <CommandEmpty>Kein Produkt gefunden.</CommandEmpty>
                    <CommandGroup>
                      {products
                        .filter(
                          (product) =>
                            !lineItems.some((item) => item.productId === product.id)
                        )
                        .map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => addLineItem(product)}
                          >
                            {getProductName(product)}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {getUnitLabel(product.unitType, locale)}
                            </span>
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
          {duplicateProductError && (
            <div className="mb-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{duplicateProductError}</span>
            </div>
          )}
          {lineItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Noch keine Produkte hinzugefügt. Wählen Sie eine Vorlage oder
              fügen Sie Produkte manuell hinzu.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('form.product')}</TableHead>
                  <TableHead className="w-[120px]">
                    {t('form.plannedQuantity')}
                  </TableHead>
                  <TableHead className="w-[100px]">Einheit</TableHead>
                  <TableHead className="w-[120px]">
                    {t('form.specialPrice')}
                  </TableHead>
                  <TableHead>{t('form.lineNote')}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => {
                  const stockWarning = getStockWarning(item)
                  return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.plannedQuantity}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              plannedQuantity: parseFloat(e.target.value) || 0
                            })
                          }
                          className={cn(
                            'w-full',
                            stockWarning.exceeds && 'border-destructive text-destructive focus-visible:ring-destructive'
                          )}
                        />
                        {stockWarning.exceeds && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {tValidation('notEnoughStock', { available: stockWarning.available })}
                            </p>
                            <button
                              type="button"
                              onClick={() => clipToAvailableStock(item.id)}
                              className="text-xs text-primary hover:underline text-left"
                            >
                              {tValidation('setToAvailable')}
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getUnitLabel(item.unitType, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            €
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.specialPrice || ''}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                specialPrice: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              })
                            }
                            placeholder="—"
                            className="w-full pl-6"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {locale === 'de' ? 'Normalpreis: ' : 'Base price: '}
                          {formatCurrency(item.basePrice)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.note || ''}
                        onChange={(e) =>
                          updateLineItem(item.id, { note: e.target.value })
                        }
                        placeholder="Optionale Notiz"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save as Template */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="saveAsTemplate"
              checked={saveAsTemplate}
              onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
            />
            <div className="space-y-2 flex-1">
              <Label htmlFor="saveAsTemplate" className="cursor-pointer">
                {t('form.saveAsTemplate')}
              </Label>
              {saveAsTemplate && (
                <Input
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    if (e.target.value.trim()) {
                      setTemplateNameError(false)
                    }
                  }}
                  placeholder={t('form.templateName')}
                  aria-invalid={templateNameError}
                  aria-describedby={templateNameError ? 'template-name-error' : undefined}
                  className={cn(
                    templateNameError &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                />
              )}
              {saveAsTemplate && templateNameError && (
                <p id="template-name-error" className="text-xs text-destructive">
                  {locale === 'de'
                    ? 'Bitte einen Vorlagen-Namen angeben.'
                    : 'Please provide a template name.'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.back()} disabled={isSaving} className="w-full sm:w-auto">
          {tActions('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || !selectedPosId} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {tActions('saveAndReady')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
