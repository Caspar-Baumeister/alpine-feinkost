'use client'

import { ProductDetailDialog } from '@/components/product-detail-dialog'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input, Input as TextInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { FormLanguageToggle } from '@/components/form-language-toggle'
import type { Product, Label as ProductLabel } from '@/lib/firestore'
import { createLabel, createProduct, getLabelBySlug, updateProduct } from '@/lib/firestore'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'
import { slugifyLabel } from '@/lib/labels/slugify'
import { deleteProductImage, getProductImageUrl, uploadProductImageWithUrl } from '@/lib/storage/products'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { cn } from '@/lib/utils'
import { Check as CheckIcon, Loader2, Package, Pencil, Plus, Tag, Upload, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type FormImage = {
  path?: string
  file?: File
  previewUrl: string
}

interface ProductsTableProps {
  products: Product[]
  labels: ProductLabel[]
  onRefresh: () => void
}

export function ProductsTable({ products, labels, onRefresh }: ProductsTableProps) {
  const t = useTranslations('products')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tLabels = useTranslations('labels')
  const locale = useLocale()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Product detail dialog state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state
  const [nameDe, setNameDe] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [sku, setSku] = useState('')
  const [unitType, setUnitType] = useState<Product['unitType']>('kg')
  const [basePrice, setBasePrice] = useState('')
  const [descriptionDe, setDescriptionDe] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [productFormLanguage, setProductFormLanguage] = useState<'de' | 'en'>('de')
  const [productFormError, setProductFormError] = useState<string | null>(null)

  // Label creation dialog
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [newLabelNameEn, setNewLabelNameEn] = useState('')
  const [newLabelNameDe, setNewLabelNameDe] = useState('')
  const [newLabelDescriptionDe, setNewLabelDescriptionDe] = useState('')
  const [newLabelDescriptionEn, setNewLabelDescriptionEn] = useState('')
  const [hasAutofilledDescriptionEn, setHasAutofilledDescriptionEn] = useState(false)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)
  const [labelFormLanguage, setLabelFormLanguage] = useState<'de' | 'en'>('de')

  const [localLabels, setLocalLabels] = useState<ProductLabel[]>(labels)

  // Image state
  const [images, setImages] = useState<FormImage[]>([])
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Image URLs for table
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())

  // Load image URLs for products with images
  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = new Map<string, string>()

      for (const product of products) {
        const primaryPath = product.imagePaths?.[0] || product.imagePath
        if (primaryPath) {
          try {
            const url = await getProductImageUrl(primaryPath)
            urls.set(product.id, url)
          } catch (error) {
            console.error(`Failed to load image for product ${product.id}:`, error)
          }
        }
      }

      setImageUrls(urls)
    }

    loadImageUrls()
  }, [products])

  useEffect(() => {
    setLocalLabels(labels)
  }, [labels])

  const normalizeUnitType = (value: Product['unitType']) => {
    if (value === 'weight') return 'kg'
    return value
  }

  const loadFormImages = async (paths: string[]) => {
    if (!paths.length) {
      setImages([])
      return
    }

    try {
      const urls = await Promise.all(paths.map(async (path) => {
        try {
          const url = await getProductImageUrl(path)
          return { path, previewUrl: url }
        } catch (error) {
          console.error('Failed to load product image url', error)
          return { path, previewUrl: '' }
        }
      }))
      setImages(urls)
    } catch (error) {
      console.error('Failed to load images', error)
    }
  }

  const fileToDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [removed] = next.splice(from, 1)
      next.splice(to, 0, removed)
      return next
    })
  }

  const nextProductId = () => {
    if (editingProduct?.id) return editingProduct.id
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `product_${Date.now()}`
  }

  const removeImageAt = (index: number) => {
    setImages((prev) => {
      const image = prev[index]
      if (image?.path && !image.file) {
        setDeletedImagePaths((paths) => [...paths, image.path as string])
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setNameDe('')
    setNameEn('')
    setSku('')
    setUnitType('kg')
    setBasePrice('')
    setDescriptionDe('')
    setDescriptionEn('')
    setIsActive(true)
    setLabelIds([])
    setProductFormLanguage('de')
    setProductFormError(null)
    setEditingProduct(null)
    setImages([])
    setDeletedImagePaths([])
    setNewLabelNameEn('')
    setNewLabelNameDe('')
    setNewLabelDescriptionDe('')
    setNewLabelDescriptionEn('')
    setHasAutofilledDescriptionEn(false)
    setLabelFormLanguage('de')
  }

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product)
    setNameDe(product.nameDe || product.name || '')
    setNameEn(product.nameEn || '')
    setSku(product.sku)
    setUnitType(normalizeUnitType(product.unitType))
    setBasePrice(product.basePrice.toString())
    setDescriptionDe(product.descriptionDe || product.description || '')
    setDescriptionEn(product.descriptionEn || '')
    setIsActive(product.isActive)
    setLabelIds(product.labels || [])
    const productImages = product.imagePaths?.length
      ? product.imagePaths
      : (product.imagePath ? [product.imagePath] : [])
    await loadFormImages(productImages)
    setDeletedImagePaths([])
    setProductFormLanguage('de')
    setProductFormError(null)

    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openProductDetail = (product: Product) => {
    setDetailProduct(product)
    setIsDetailOpen(true)
  }

  const handleUnitTypeChange = (value: Product['unitType']) => {
    setUnitType(value)
  }

  const maybeAutofillDescriptionEn = () => {
    if (hasAutofilledDescriptionEn) return
    if (newLabelDescriptionEn.trim()) return
    if (!newLabelDescriptionDe.trim()) return
    setNewLabelDescriptionEn(newLabelDescriptionDe)
    setHasAutofilledDescriptionEn(true)
  }

  const handleCreateLabel = async () => {
    const nameEnInput = newLabelNameEn.trim()
    const nameDe = newLabelNameDe.trim()
    const descriptionDe = newLabelDescriptionDe.trim()
    const descriptionEn = newLabelDescriptionEn.trim()
    const nameEn = nameEnInput || nameDe
    const slugSource = nameEnInput || nameDe

    if (!nameDe) {
      setLabelError(locale === 'de' ? 'Bitte deutschen Namen eingeben' : 'Please provide the German name')
      return
    }

    if (!descriptionDe) {
      setLabelError(
        locale === 'de'
          ? 'Bitte eine deutsche Beschreibung hinterlegen'
          : 'Please provide a German description'
      )
      return
    }

    const slug = slugifyLabel(slugSource)
    const existsLocal = localLabels.some((l) => l.slug === slug)
    if (existsLocal) {
      setLabelError(tLabels('slugExists'))
      return
    }

    setLabelError(null)
    setIsCreatingLabel(true)
    try {
      const existingRemote = await getLabelBySlug(slug)
      if (existingRemote) {
        setLabelError(tLabels('slugExists'))
        setIsCreatingLabel(false)
        return
      }

      const newId = await createLabel({
        slug,
        nameEn,
        nameDe,
        descriptionDe,
        descriptionEn: descriptionEn || null
      })
      const newLabel: ProductLabel = {
        id: newId,
        slug,
        nameEn,
        nameDe,
        descriptionDe,
        descriptionEn: descriptionEn || null,
        createdAt: null,
        updatedAt: null
      }
      setLocalLabels([...localLabels, newLabel])
      setLabelIds((prev) => [...prev, slug])
      setIsLabelDialogOpen(false)
      setNewLabelNameEn('')
      setNewLabelNameDe('')
      setNewLabelDescriptionDe('')
      setNewLabelDescriptionEn('')
      setHasAutofilledDescriptionEn(false)
      setLabelFormLanguage('de')
    } catch (error) {
      console.error('Failed to create label', error)
      setLabelError(error instanceof Error ? error.message : 'Error creating label')
    } finally {
      setIsCreatingLabel(false)
      onRefresh()
    }
  }

  const toggleLabelSelection = (id: string) => {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024

    const newImages: FormImage[] = []
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(locale === 'de'
          ? 'Nur JPG, PNG, WebP oder GIF Dateien sind erlaubt'
          : 'Only JPG, PNG, WebP or GIF files are allowed'
        )
        continue
      }
      if (file.size > maxSize) {
        alert(locale === 'de'
          ? 'Die Datei darf maximal 5MB groß sein'
          : 'File size must be less than 5MB'
        )
        continue
      }

      try {
        const previewUrl = await fileToDataUrl(file)
        newImages.push({ file, previewUrl })
      } catch (error) {
        console.error('Failed to create preview', error)
      }
    }

    if (newImages.length) {
      setImages((prev) => [...prev, ...newImages])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError(null)

    const trimmedNameDe = nameDe.trim()
    const normalizedUnitType = normalizeUnitType(unitType)
    const parsedBasePrice = parseFloat(basePrice)

    if (!trimmedNameDe) {
      setProductFormError(locale === 'de' ? 'Bitte deutschen Namen eingeben' : 'Please enter the German name')
      return
    }

    if (Number.isNaN(parsedBasePrice)) {
      setProductFormError(locale === 'de' ? 'Bitte Grundpreis eingeben' : 'Please enter the base price')
      return
    }

    setIsSaving(true)

    try {
      const productId = nextProductId()

      setIsUploadingImage(true)
      const resolvedImagePaths: string[] = []
      for (const image of images) {
        if (image.path) {
          resolvedImagePaths.push(image.path)
        } else if (image.file) {
          const { path } = await uploadProductImageWithUrl(productId, image.file)
          resolvedImagePaths.push(path)
        }
      }
      setIsUploadingImage(false)

      const productData = {
        nameDe: trimmedNameDe,
        nameEn: nameEn.trim() || null,
        sku,
        labels: labelIds,
        unitType: normalizedUnitType,
        basePrice: parsedBasePrice,
        descriptionDe: descriptionDe.trim(),
        descriptionEn: descriptionEn.trim() || null,
        imagePaths: resolvedImagePaths,
        imagePath: resolvedImagePaths[0] || null,
        isActive,
        totalStock: 0,
        currentStock: 0
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await createProduct(productData, productId)
      }

      if (deletedImagePaths.length) {
        await Promise.all(deletedImagePaths.map((path) => deleteProductImage(path)))
        setDeletedImagePaths([])
      }

      setIsDialogOpen(false)
      resetForm()
      onRefresh()
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setIsSaving(false)
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t('editProduct') : t('addProduct')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{locale === 'de' ? 'Produktbilder' : 'Product images'}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {locale === 'de' ? 'Bilder hochladen' : 'Upload images'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {images.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground text-center">
                    {locale === 'de' ? 'Noch keine Bilder hinzugefügt' : 'No images yet'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="w-28">
                        <div className="relative h-28 w-28 overflow-hidden rounded-md border bg-muted">
                          {image.previewUrl ? (
                            <Image
                              src={image.previewUrl}
                              alt={`Product image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              {locale === 'de' ? 'Kein Bild' : 'No image'}
                            </div>
                          )}
                          {index === 0 ? (
                            <span className="absolute left-1 top-1 rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {locale === 'de' ? 'Hauptbild' : 'Primary'}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeImageAt(index)}
                            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {index > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveImage(index, 0)}
                            >
                              {locale === 'de' ? 'Als Hauptbild' : 'Set primary'}
                            </Button>
                          ) : null}
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={index === 0}
                              onClick={() => moveImage(index, index - 1)}
                              aria-label="Move left"
                            >
                              ‹
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={index === images.length - 1}
                              onClick={() => moveImage(index, index + 1)}
                              aria-label="Move right"
                            >
                              ›
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, GIF (max 5MB). Die erste Position ist das Hauptbild.
                </p>
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === 'de' ? 'Bilder werden hochgeladen...' : 'Uploading images...'}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-muted-foreground">
                  {locale === 'de' ? 'Sprache im Formular' : 'Form language'}
                </div>
                <FormLanguageToggle
                  value={productFormLanguage}
                  onChange={setProductFormLanguage}
                />
              </div>

              {productFormError ? (
                <p className="text-sm text-destructive">{productFormError}</p>
              ) : null}

              {productFormLanguage === 'de' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameDe">
                      {locale === 'de' ? 'Name (DE)' : 'Name (DE)'}
                    </Label>
                    <Input
                      id="nameDe"
                      value={nameDe}
                      onChange={(e) => setNameDe(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionDe">{locale === 'de' ? 'Beschreibung (DE)' : 'Description (DE)'}</Label>
                    <Textarea
                      id="descriptionDe"
                      value={descriptionDe}
                      onChange={(e) => setDescriptionDe(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">
                      {locale === 'de' ? 'Name (EN)' : 'Name (EN)'}
                    </Label>
                    <Input
                      id="nameEn"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder={locale === 'de' ? 'Optional' : 'Optional'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">{locale === 'de' ? 'Beschreibung (EN)' : 'Description (EN)'}</Label>
                    <Textarea
                      id="descriptionEn"
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      placeholder={locale === 'de' ? 'Optional' : 'Optional'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitType">{t('form.unit')}</Label>
                  <Select
                    value={unitType}
                    onValueChange={(value) => handleUnitTypeChange(value as Product['unitType'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="piece">{t('form.unitPiece')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">{t('form.basePrice')}</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t('form.labels')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex gap-2 flex-wrap items-center text-left">
                        {labelIds.length === 0
                          ? t('filters.allLabels')
                          : labelIds.map((id) => {
                            const lbl = localLabels.find((l) => l.slug === id)
                            return (
                              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                                <Tag className="h-3 w-3" />
                                {lbl ? getLabelDisplayName(lbl, locale) : id}
                              </span>
                            )
                          })}
                      </span>
                      <Plus className="h-4 w-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('filters.searchLabels')} />
                      <CommandList>
                        <CommandEmpty>{t('filters.noLabels')}</CommandEmpty>
                        <CommandGroup>
                          {localLabels.map((label) => {
                            const selected = labelIds.includes(label.slug)
                            return (
                              <CommandItem
                                key={label.id}
                                onSelect={() => toggleLabelSelection(label.slug)}
                              >
                                <CheckIcon className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                {getLabelDisplayName(label, locale)}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setIsLabelDialogOpen(true)
                            }}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {tLabels('new')}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">{t('form.active')}</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  {tActions('cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploadingImage
                        ? (locale === 'de' ? 'Bild hochladen...' : 'Uploading image...')
                        : `${tActions('save')}...`
                      }
                    </>
                  ) : (
                    tActions('save')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">{t('columns.thumbnail')}</TableHead>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.unit')}</TableHead>
                <TableHead className="text-right">{t('columns.basePrice')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="w-[100px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {tCommon('noFilteredResults')}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const imageUrl = imageUrls.get(product.id)
                  const unitLabel = getUnitLabel(product.unitType, locale)
                  const productName = getProductNameForLocale(product, locale)

                  return (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openProductDetail(product)}
                    >
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{productName}</TableCell>
                      <TableCell>{unitLabel}</TableCell>
                      <TableCell className="text-right">
                        €{product.basePrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(product)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {tActions('edit')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={detailProduct}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Create Label Dialog */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabels('new')}</DialogTitle>
            <DialogDescription>
              {tLabels('create')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-muted-foreground">
                {locale === 'de' ? 'Sprache im Formular' : 'Form language'}
              </div>
              <FormLanguageToggle
                value={labelFormLanguage}
                onChange={setLabelFormLanguage}
              />
            </div>

            {labelFormLanguage === 'de' ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="labelNameDe">{tLabels('nameDe')}</Label>
                  <TextInput
                    id="labelNameDe"
                    value={newLabelNameDe}
                    onChange={(e) => setNewLabelNameDe(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="labelDescriptionDe">{tLabels('descriptionDe')}</Label>
                  <Textarea
                    id="labelDescriptionDe"
                    value={newLabelDescriptionDe}
                    onChange={(e) => setNewLabelDescriptionDe(e.target.value)}
                    placeholder={tLabels('descriptionDePlaceholder')}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="labelNameEn">
                    {tLabels('nameEn')} ({tLabels('optional')})
                  </Label>
                  <TextInput
                    id="labelNameEn"
                    value={newLabelNameEn}
                    onChange={(e) => setNewLabelNameEn(e.target.value)}
                    placeholder={tLabels('nameEn')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="labelDescriptionEn">
                    {tLabels('descriptionEn')} ({tLabels('optional')})
                  </Label>
                  <Textarea
                    id="labelDescriptionEn"
                    value={newLabelDescriptionEn}
                    onChange={(e) => setNewLabelDescriptionEn(e.target.value)}
                    onFocus={maybeAutofillDescriptionEn}
                    placeholder={tLabels('descriptionEnPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tLabels('descriptionAutofillHint')}
                  </p>
                </div>
              </>
            )}

            {labelError && (
              <p className="text-sm text-destructive">{labelError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>
              {tActions('cancel')}
            </Button>
            <Button onClick={handleCreateLabel} disabled={isCreatingLabel}>
              {isCreatingLabel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tLabels('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
