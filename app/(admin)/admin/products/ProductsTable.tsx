'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Plus, Pencil, Package, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { Product, createProduct, updateProduct } from '@/lib/firestore'
import { uploadProductImageWithUrl, getProductImageUrl, deleteProductImage } from '@/lib/storage/products'

interface ProductsTableProps {
  initialData: Product[]
  onDataChange: () => void
}

export function ProductsTable({ initialData, onDataChange }: ProductsTableProps) {
  const t = useTranslations('products')
  const tActions = useTranslations('actions')
  const locale = useLocale()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unitType, setUnitType] = useState<'piece' | 'weight'>('weight')
  const [unitLabel, setUnitLabel] = useState('kg')
  const [basePrice, setBasePrice] = useState('')
  const [description, setDescription] = useState('')
  const [totalStock, setTotalStock] = useState('')
  const [isActive, setIsActive] = useState(true)

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

      for (const product of initialData) {
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
  }, [initialData])

  const resetForm = () => {
    setName('')
    setSku('')
    setUnitType('weight')
    setUnitLabel('kg')
    setBasePrice('')
    setDescription('')
    setTotalStock('')
    setIsActive(true)
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

  const handleUnitTypeChange = (value: 'piece' | 'weight') => {
    setUnitType(value)
    setUnitLabel(value === 'piece' ? 'Stück' : 'kg')
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

      const productData = {
        name,
        sku,
        unitType,
        unitLabel,
        basePrice: parseFloat(basePrice) || 0,
        description,
        imagePath,
        isActive,
        totalStock: parseFloat(totalStock) || 0
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
      onDataChange()
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
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {locale === 'de' ? 'Keine Produkte vorhanden' : 'No products found'}
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((product) => {
                  const imageUrl = imageUrls.get(product.id)

                  return (
                    <TableRow key={product.id}>
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
                          onClick={() => openEditDialog(product)}
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
    </div>
  )
}
