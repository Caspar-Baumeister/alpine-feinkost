'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import {
  AppUser,
  PacklistItem,
  PacklistTemplate,
  Pos,
  Product,
  createPacklist,
  createPacklistTemplate
} from '@/lib/firestore'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { cn } from '@/lib/utils'
import { usePacklistFormDraftStore } from '@/stores/usePacklistFormDraftStore'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const { saveDraft, getDraft, clearDraft } = usePacklistFormDraftStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hasRestored, setHasRestored] = useState(false)

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
  // Local-only state: track which items are packed (not persisted to Firestore)
  const [packedItemIds, setPackedItemIds] = useState<Set<string>>(new Set())
  // Track when items were added for sorting (newest first in unpacked section)
  const [itemAddedAt, setItemAddedAt] = useState<Map<string, number>>(new Map())
  // Track when items were packed for sorting within packed section
  const [itemPackedAt, setItemPackedAt] = useState<Map<string, number>>(new Map())
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Restore draft on mount
  useEffect(() => {
    if (!currentUser) return

    const draft = getDraft(currentUser.uid)
    if (draft) {
      // Restore form state from draft
      setSelectedPosId(draft.selectedPosId)
      setSelectedDate(draft.selectedDate ? new Date(draft.selectedDate) : new Date())
      setAssignedUserIds(draft.assignedUserIds)
      setChangeAmount(draft.changeAmount)
      setNote(draft.note)
      setLineItems(draft.lineItems)
      setSaveAsTemplate(draft.saveAsTemplate)
      setTemplateName(draft.templateName)
      setSelectedTemplateId(draft.selectedTemplateId)
      // Reset packed state when restoring draft (packed state is not persisted)
      setPackedItemIds(new Set())
      setItemPackedAt(new Map())
      // Restore addedAt timestamps for sorting
      const restoredAddedAt = new Map<string, number>()
      draft.lineItems.forEach((item) => {
        restoredAddedAt.set(item.id, Date.now() - draft.lineItems.length + draft.lineItems.indexOf(item))
      })
      setItemAddedAt(restoredAddedAt)
      setHasRestored(true)
    } else {
      setHasRestored(true)
    }
  }, [currentUser, getDraft])

  // Debounced save function
  const debouncedSaveDraft = useCallback(() => {
    if (!currentUser || !hasRestored) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(currentUser.uid, {
        selectedPosId,
        selectedDate,
        assignedUserIds,
        changeAmount,
        note,
        lineItems,
        saveAsTemplate,
        templateName,
        selectedTemplateId
      })
    }, 500) // 500ms debounce
  }, [
    currentUser,
    hasRestored,
    selectedPosId,
    selectedDate,
    assignedUserIds,
    changeAmount,
    note,
    lineItems,
    saveAsTemplate,
    templateName,
    selectedTemplateId,
    saveDraft
  ])

  // Save draft whenever form state changes (but not on initial restore)
  useEffect(() => {
    if (currentUser && hasRestored) {
      debouncedSaveDraft()
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    selectedPosId,
    selectedDate,
    assignedUserIds,
    changeAmount,
    note,
    lineItems,
    saveAsTemplate,
    templateName,
    selectedTemplateId,
    currentUser,
    hasRestored,
    debouncedSaveDraft
  ])

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
      const now = Date.now()
      const templateItems = template.items.map((item, idx) => ({
        id: `${now}-${idx}`,
        productId: item.productId,
        productName: item.productName,
        unitType: item.unitType,
        unitLabel: getUnitLabel(item.unitType, locale),
        basePrice: item.basePrice,
        plannedQuantity: item.defaultQuantity,
        specialPrice: item.specialPrice,
        note: item.note
      }))
      setLineItems(templateItems)
      // Track when items were added (for sorting - newest first in unpacked section)
      const addedAtMap = new Map<string, number>()
      templateItems.forEach((item, idx) => {
        addedAtMap.set(item.id, now - idx) // Slightly offset to maintain order
      })
      setItemAddedAt(addedAtMap)
      // Reset packed state when loading template
      setPackedItemIds(new Set())
      setItemPackedAt(new Map())
      if (template.changeAmount) {
        setChangeAmount(template.changeAmount.toString())
      }
      if (template.note) {
        setNote(template.note)
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
    // Clean up local state when item is removed
    setPackedItemIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setItemAddedAt((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    setItemPackedAt((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  const togglePacked = (id: string) => {
    setPackedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // Remove packed timestamp when unpacking
        setItemPackedAt((prevPacked) => {
          const nextPacked = new Map(prevPacked)
          nextPacked.delete(id)
          return nextPacked
        })
      } else {
        next.add(id)
        // Record when item was packed (for sorting within packed section)
        setItemPackedAt((prevPacked) => new Map(prevPacked).set(id, Date.now()))
      }
      return next
    })
  }

  const toggleUserAssignment = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId))
    } else {
      setAssignedUserIds([...assignedUserIds, userId])
    }
    setUserError(false)
  }

  // Sort items: unpacked first (newest at top), packed last (by packed time)
  const sortedLineItems = useMemo(() => {
    const unpacked: LineItem[] = []
    const packed: LineItem[] = []

    lineItems.forEach((item) => {
      if (packedItemIds.has(item.id)) {
        packed.push(item)
      } else {
        unpacked.push(item)
      }
    })

    // Sort unpacked: newest first (by addedAt timestamp)
    unpacked.sort((a, b) => {
      const aTime = itemAddedAt.get(a.id) || 0
      const bTime = itemAddedAt.get(b.id) || 0
      return bTime - aTime // Descending (newest first)
    })

    // Sort packed: by packed time (stable order)
    packed.sort((a, b) => {
      const aTime = itemPackedAt.get(a.id) || 0
      const bTime = itemPackedAt.get(b.id) || 0
      return aTime - bTime // Ascending (first packed first)
    })

    return [...unpacked, ...packed]
  }, [lineItems, packedItemIds, itemAddedAt, itemPackedAt])

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

    // Validate quantities (must be >= 1)
    const invalidQuantities = lineItems.filter((item) => !item.plannedQuantity || item.plannedQuantity < 1)
    if (invalidQuantities.length > 0) {
      hasError = true
      // Could show a toast or inline error here, but for now just block save
    }

    if (hasError) return

    setIsSaving(true)

    try {
      // Convert line items to PacklistItem format, ensuring minimum quantity of 1
      const items: PacklistItem[] = lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitType: item.unitType,
        unitLabel: item.unitLabel,
        basePrice: item.basePrice,
        specialPrice: item.specialPrice,
        plannedQuantity: item.plannedQuantity && item.plannedQuantity > 0 ? item.plannedQuantity : 1, // Ensure minimum of 1
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
            defaultQuantity: item.plannedQuantity && item.plannedQuantity > 0 ? item.plannedQuantity : 1, // Ensure minimum of 1
            note: item.note
          }))
        })
      }

      // Clear draft after successful creation
      if (currentUser) {
        clearDraft(currentUser.uid)
      }
      // Clear packed state
      setPackedItemIds(new Set())
      setItemPackedAt(new Map())

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
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLineItems.map((item, index) => {
                    const stockWarning = getStockWarning(item)
                    const isPacked = packedItemIds.has(item.id)
                    const isFirstPacked = index > 0 && !packedItemIds.has(sortedLineItems[index - 1]?.id) && isPacked
                    return (
                      <React.Fragment key={item.id}>
                        {isFirstPacked && (
                          <TableRow key={`divider-${item.id}`} className="bg-muted/30">
                            <TableCell colSpan={6} className="h-1 p-0">
                              <div className="h-px bg-border" />
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          className={cn(
                            isPacked && 'opacity-60 bg-muted/20'
                          )}
                        >
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Input
                                type="number"
                                step="0.1"
                                min="1"
                                value={item.plannedQuantity > 0 ? item.plannedQuantity : ''}
                                onFocus={(e) => {
                                  // Select all text when focused for easy replacement
                                  e.target.select()
                                }}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Allow empty string during editing (user is clearing the field)
                                  if (value === '') {
                                    updateLineItem(item.id, {
                                      plannedQuantity: 0 // Temporary 0 for empty state, will be validated on save
                                    })
                                  } else {
                                    const numValue = parseFloat(value)
                                    // Only update if it's a valid positive number
                                    if (!isNaN(numValue) && numValue > 0) {
                                      updateLineItem(item.id, {
                                        plannedQuantity: numValue
                                      })
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure minimum of 1 when field loses focus (if empty or invalid)
                                  const value = parseFloat(e.target.value)
                                  if (isNaN(value) || value < 1) {
                                    updateLineItem(item.id, {
                                      plannedQuantity: 1
                                    })
                                  }
                                }}
                                disabled={isPacked}
                                className={cn(
                                  'w-full',
                                  stockWarning.exceeds && 'border-destructive text-destructive focus-visible:ring-destructive',
                                  isPacked && 'cursor-not-allowed',
                                  (!item.plannedQuantity || item.plannedQuantity < 1) && 'border-destructive'
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
                                  disabled={isPacked}
                                  placeholder="—"
                                  className={cn(
                                    'w-full pl-6',
                                    isPacked && 'cursor-not-allowed'
                                  )}
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
                              disabled={isPacked}
                              placeholder="Optionale Notiz"
                              className={cn(isPacked && 'cursor-not-allowed')}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePacked(item.id)}
                                className={cn(
                                  isPacked
                                    ? 'text-primary hover:text-primary'
                                    : 'text-muted-foreground hover:text-primary'
                                )}
                                aria-label={
                                  isPacked
                                    ? locale === 'de'
                                      ? 'Als ungepackt markieren'
                                      : 'Mark as unpacked'
                                    : locale === 'de'
                                      ? 'Als gepackt markieren'
                                      : 'Mark as packed'
                                }
                              >
                                {isPacked ? (
                                  <RotateCcw className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLineItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
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
        <Button
          variant="outline"
          onClick={() => {
            // Clear draft when canceling
            if (currentUser) {
              clearDraft(currentUser.uid)
            }
            // Clear packed state
            setPackedItemIds(new Set())
            setItemPackedAt(new Map())
            router.back()
          }}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
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
