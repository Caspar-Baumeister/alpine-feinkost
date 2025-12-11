'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Pencil, Loader2 } from 'lucide-react'
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
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Product, updateProductStock } from '@/lib/firestore'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { useUserLookup } from '@/lib/users/useUserLookup'

interface LagerbestandTableProps {
  products: Product[]
  onDataChange: () => void
}

export function LagerbestandTable({ products, onDataChange }: LagerbestandTableProps) {
  const t = useTranslations('lagerbestand')
  const tActions = useTranslations('actions')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const { user: currentUser } = useCurrentUser()
  const { getDisplayName } = useUserLookup()
  const [view, setView] = useState<'total' | 'current'>('current')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editingUnitLabel = editingProduct ? getUnitLabel(editingProduct.unitType, locale) : ''

  const handleAdjustStock = async () => {
    if (!editingProduct) return
    if (!currentUser) {
      console.error('No authenticated user found when updating stock')
      return
    }

    setIsSaving(true)
    try {
      await updateProductStock(
        editingProduct.id,
        parseFloat(newStock) || 0,
        undefined,
        currentUser.uid
      )
      setEditingProduct(null)
      setNewStock('')
      onDataChange()
    } catch (error) {
      console.error('Failed to update stock:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const openAdjustDialog = (product: Product) => {
    setEditingProduct(product)
    // When adjusting stock, we adjust totalStock (which also adjusts currentStock by the same delta)
    setNewStock(product.totalStock.toString())
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'total' | 'current')}>
        <TabsList>
          <TabsTrigger value="current">{t('viewCurrent')}</TabsTrigger>
          <TabsTrigger value="total">{t('viewTotal')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.product')}</TableHead>
                <TableHead>{t('columns.unit')}</TableHead>
                <TableHead className="text-right">
                  {view === 'total' ? t('columns.totalStock') : t('columns.currentStock')}
                </TableHead>
                <TableHead>{t('columns.lastUpdated')}</TableHead>
                <TableHead className="w-[100px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Keine Produkte vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const unitLabel = getUnitLabel(product.unitType, locale)
                  const stockValue = view === 'total' ? product.totalStock : product.currentStock
                  const lastUpdated = product.updatedAt
                    ? format(new Date(product.updatedAt), 'dd.MM.yyyy, HH:mm', { locale: dateLocale })
                    : null
                  const lastUpdatedBy = getDisplayName(product.lastStockUpdatedByUserId)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{unitLabel}</TableCell>
                      <TableCell className="text-right">
                        {stockValue} {unitLabel}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lastUpdated ? (
                          <div className="flex flex-col leading-tight">
                            <span>{lastUpdated}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('lastUpdatedBy', { user: lastUpdatedBy || t('unknownUser') })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAdjustDialog(product)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {tActions('adjust')}
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

      {/* Adjust Stock Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adjustDialog.title')}: {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show current values */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('columns.totalStock')}:</span>
                <span className="ml-2 font-medium">{editingProduct?.totalStock} {editingUnitLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('columns.currentStock')}:</span>
                <span className="ml-2 font-medium">{editingProduct?.currentStock} {editingUnitLabel}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newStock">{t('adjustDialog.newTotalStock')} ({editingUnitLabel})</Label>
              <Input
                id="newStock"
                type="number"
                step="0.1"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('adjustDialog.hint')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingProduct(null)}
              disabled={isSaving}
            >
              {tActions('cancel')}
            </Button>
            <Button onClick={handleAdjustStock} disabled={isSaving}>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
