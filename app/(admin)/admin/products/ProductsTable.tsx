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
import type { Product, Label as ProductLabel } from '@/lib/firestore'
import { createLabel, createProduct, updateProduct } from '@/lib/firestore'
import { deleteProductImage, getProductImageUrl, uploadProductImageWithUrl } from '@/lib/storage/products'
import { cn } from '@/lib/utils'
import { Check as CheckIcon, Loader2, Package, Pencil, Plus, Tag, Upload, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface ProductsTableProps {
  products: Product[]
  labels: ProductLabel[]
  onRefresh: () => void
}

export function ProductsTable({ products, labels, onRefresh }: ProductsTableProps) {
  const t = useTranslations('products')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Product detail dialog state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unitType, setUnitType] = useState<'piece' | 'weight'>('weight')
  const [unitLabel, setUnitLabel] = useState('kg')
  const [basePrice, setBasePrice] = useState('')
  const [description, setDescription] = useState('')
  const [totalStock, setTotalStock] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [labelIds, setLabelIds] = useState<string[]>([])

  // Label creation dialog
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)

  const [localLabels, setLocalLabels] = useState<ProductLabel[]>(labels)

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Image URLs for table
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())

  // Load image URLs for products with images
  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = new Map<string, string>()

      for (const product of products) {
        if (product.imagePath) {
          try {
            const url = await getProductImageUrl(product.imagePath)
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

  const resetForm = () => {
    setName('')
    setSku('')
    setUnitType('weight')
    setUnitLabel('kg')
    setBasePrice('')
    setDescription('')
    setTotalStock('')
    setIsActive(true)
    setLabelIds([])
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview(null)
    setExistingImagePath(null)
  }

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setSku(product.sku)
    setUnitType(product.unitType)
    setUnitLabel(product.unitLabel)
    setBasePrice(product.basePrice.toString())
    setDescription(product.description)
    setTotalStock(product.totalStock.toString())
    setIsActive(product.isActive)
    setLabelIds(product.labels || [])
    setExistingImagePath(product.imagePath)

    // Load existing image preview
    if (product.imagePath) {
      try {
        const url = await getProductImageUrl(product.imagePath)
        setImagePreview(url)
      } catch (error) {
        console.error('Failed to load image preview:', error)
      }
    }

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

  const handleUnitTypeChange = (value: 'piece' | 'weight') => {
    setUnitType(value)
    setUnitLabel(value === 'piece' ? 'Stück' : 'kg')
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      setLabelError(locale === 'de' ? 'Bitte einen Namen eingeben' : 'Please provide a name')
      return
    }

    setLabelError(null)
    setIsCreatingLabel(true)
    try {
      const newId = await createLabel(newLabelName.trim())
      const newLabel: ProductLabel = {
        id: newId,
        name: newLabelName.trim(),
        createdAt: null,
        updatedAt: null
      }
      setLocalLabels([...localLabels, newLabel])
      setLabelIds((prev) => [...prev, newId])
      setIsLabelDialogOpen(false)
      setNewLabelName('')
    } catch (error) {
      console.error('Failed to create label', error)
      setLabelError(error instanceof Error ? error.message : 'Error creating label')
    } finally {
      setIsCreatingLabel(false)
      // Refresh from server to keep in sync
      onRefresh()
    }
  }

  const toggleLabelSelection = (id: string) => {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert(locale === 'de'
        ? 'Nur JPG, PNG, WebP oder GIF Dateien sind erlaubt'
        : 'Only JPG, PNG, WebP or GIF files are allowed'
      )
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(locale === 'de'
        ? 'Die Datei darf maximal 5MB groß sein'
        : 'File size must be less than 5MB'
      )
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImagePath(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let imagePath = existingImagePath

      // Handle image upload/delete
      if (imageFile) {
        setIsUploadingImage(true)

        // Delete old image if exists
        if (existingImagePath) {
          await deleteProductImage(existingImagePath)
        }

        // Generate a temporary ID for new products
        const productId = editingProduct?.id || `temp_${Date.now()}`
        const { path } = await uploadProductImageWithUrl(productId, imageFile)
        imagePath = path

        setIsUploadingImage(false)
      } else if (!imagePreview && existingImagePath) {
        // Image was removed
        await deleteProductImage(existingImagePath)
        imagePath = null
      }

      const stockValue = parseFloat(totalStock) || 0
      const productData = {
        name,
        sku,
        labels: labelIds,
        unitType,
        unitLabel,
        basePrice: parseFloat(basePrice) || 0,
        description,
        imagePath,
        isActive,
        totalStock: stockValue,
        currentStock: stockValue // For new products, currentStock equals totalStock
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        const newId = await createProduct(productData)

        // If we uploaded an image with a temp ID, we need to re-upload with the real ID
        if (imageFile && imagePath?.includes('temp_')) {
          await deleteProductImage(imagePath)
          const { path: newPath } = await uploadProductImageWithUrl(newId, imageFile)
          await updateProduct(newId, { imagePath: newPath })
        }
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
              <div className="space-y-2">
                <Label>{t('columns.thumbnail')}</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"

                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>{locale === 'de' ? 'Klicken zum Hochladen' : 'Click to upload'}</p>
                    <p className="text-xs">JPG, PNG, WebP, GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('form.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitType">{t('form.unit')}</Label>
                  <Select value={unitType} onValueChange={handleUnitTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">{t('form.unitPiece')}</SelectItem>
                      <SelectItem value="weight">{t('form.unitWeight')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitLabel">
                    {locale === 'de' ? 'Einheits-Label' : 'Unit Label'}
                  </Label>
                  <Input
                    id="unitLabel"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="totalStock">
                    {locale === 'de' ? 'Bestand' : 'Stock'}
                  </Label>
                  <Input
                    id="totalStock"
                    type="number"
                    step="0.1"
                    value={totalStock}
                    onChange={(e) => setTotalStock(e.target.value)}
                  />
                </div>
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
                            const lbl = localLabels.find((l) => l.id === id)
                            return (
                              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                                <Tag className="h-3 w-3" />
                                {lbl?.name || id}
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
                            const selected = labelIds.includes(label.id)
                            return (
                              <CommandItem
                                key={label.id}
                                onSelect={() => toggleLabelSelection(label.id)}
                              >
                                <CheckIcon className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                {label.name}
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
                            {t('labels.new')}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                <TableHead className="text-right">
                  {locale === 'de' ? 'Bestand' : 'Stock'}
                </TableHead>
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
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.unitLabel}</TableCell>
                      <TableCell className="text-right">
                        €{product.basePrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.totalStock} {product.unitLabel}
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
            <DialogTitle>{t('labels.new')}</DialogTitle>
            <DialogDescription>
              {t('labels.create')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="labelName">{t('labels.name')}</Label>
              <TextInput
                id="labelName"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
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
              {t('labels.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
