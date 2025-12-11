'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { X, Package, Scale, Tag, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/lib/firestore'
import { getProductDescriptionForLocale } from '@/lib/products/getProductDescriptionForLocale'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getUnitLabelForLocale } from '@/lib/products/getUnitLabelForLocale'
import { getProductImageUrl } from '@/lib/storage/products'

interface ProductDetailDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange
}: ProductDetailDialogProps) {
  const t = useTranslations('products')
  const locale = useLocale()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const description = product ? getProductDescriptionForLocale(product, locale) : ''
  const productName = product ? getProductNameForLocale(product, locale) : ''
  const unitLabel = product ? getUnitLabelForLocale(product, locale) : ''

  useEffect(() => {
    const loadImage = async () => {
      if (!product?.imagePath) {
        setImageUrl(null)
        return
      }

      setIsLoadingImage(true)
      try {
        const url = await getProductImageUrl(product.imagePath)
        setImageUrl(url)
      } catch (error) {
        console.error('Failed to load product image:', error)
        setImageUrl(null)
      } finally {
        setIsLoadingImage(false)
      }
    }

    if (open && product) {
      loadImage()
    }
  }, [open, product])

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-muted">
            {isLoadingImage ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16 mb-2" />
                <span className="text-sm">
                  {locale === 'de' ? 'Kein Bild verfügbar' : 'No image available'}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="grid gap-4">
            {/* Status & SKU Row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  product.isActive
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                }
              >
                {product.isActive
                  ? (locale === 'de' ? 'Aktiv' : 'Active')
                  : (locale === 'de' ? 'Inaktiv' : 'Inactive')
                }
              </Badge>
              {product.sku && (
                <Badge variant="secondary" className="font-mono">
                  SKU: {product.sku}
                </Badge>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Price */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Tag className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('columns.basePrice')}
                  </p>
                  <p className="text-lg font-semibold">
                    €{product.basePrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'de' ? 'pro' : 'per'} {unitLabel}
                  </p>
                </div>
              </div>

              {/* Unit */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Scale className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('columns.unit')}
                  </p>
                  <p className="text-lg font-semibold">{unitLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.unitType === 'piece'
                      ? (locale === 'de' ? 'Stückware' : 'Piece goods')
                      : (locale === 'de' ? 'Gewichtsware' : 'Weight goods')
                    }
                  </p>
                </div>
              </div>

              {/* Total Stock */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Package className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'de' ? 'Gesamtbestand' : 'Total Stock'}
                  </p>
                  <p className="text-lg font-semibold">
                    {product.totalStock} {product.unitLabel}
                  </p>
                </div>
              </div>

              {/* Current Stock */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Package className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'de' ? 'Aktueller Bestand' : 'Current Stock'}
                  </p>
                  <p className="text-lg font-semibold">
                    {product.currentStock} {product.unitLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'de' ? 'Verfügbar im Lager' : 'Available in warehouse'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {description ? (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('form.description')}
                    </p>
                    <p className="text-sm whitespace-pre-line">{description}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

