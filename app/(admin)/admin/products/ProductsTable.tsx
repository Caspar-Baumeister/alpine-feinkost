'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Package, Loader2 } from 'lucide-react'
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

interface ProductsTableProps {
  initialData: Product[]
  onDataChange: () => void
}

export function ProductsTable({ initialData, onDataChange }: ProductsTableProps) {
  const t = useTranslations('products')
  const tActions = useTranslations('actions')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unitType, setUnitType] = useState<'piece' | 'weight'>('weight')
  const [unitLabel, setUnitLabel] = useState('kg')
  const [basePrice, setBasePrice] = useState('')
  const [description, setDescription] = useState('')
  const [totalStock, setTotalStock] = useState('')
  const [isActive, setIsActive] = useState(true)

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
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setSku(product.sku)
    setUnitType(product.unitType)
    setUnitLabel(product.unitLabel)
    setBasePrice(product.basePrice.toString())
    setDescription(product.description)
    setTotalStock(product.totalStock.toString())
    setIsActive(product.isActive)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const productData = {
        name,
        sku,
        unitType,
        unitLabel,
        basePrice: parseFloat(basePrice) || 0,
        description,
        imagePath: null,
        isActive,
        totalStock: parseFloat(totalStock) || 0
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await createProduct(productData)
      }

      setIsDialogOpen(false)
      resetForm()
      onDataChange()
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setIsSaving(false)
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t('editProduct') : t('addProduct')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="unitLabel">Einheits-Label</Label>
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
                  <Label htmlFor="totalStock">Bestand</Label>
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
                      {tActions('save')}...
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
                <TableHead className="w-[50px]">{t('columns.thumbnail')}</TableHead>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.unit')}</TableHead>
                <TableHead className="text-right">{t('columns.basePrice')}</TableHead>
                <TableHead className="text-right">Bestand</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="w-[100px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Keine Produkte vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
