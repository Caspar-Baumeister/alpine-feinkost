'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Package, Tag, FileText, Loader2, Tags } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Product, Label, listLabels } from '@/lib/firestore'
import { getProductDescriptionForLocale } from '@/lib/products/getProductDescriptionForLocale'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getUnitLabel } from '@/lib/products/getUnitLabelForLocale'
import { getProductImageUrl } from '@/lib/storage/products'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'
import { getLabelDescription } from '@/lib/labels/getLabelDescription'

interface ProductDetailDialogProps {
  product: Product | null
  specialPrice?: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailDialog({
  product,
  specialPrice,
  open,
  onOpenChange
}: ProductDetailDialogProps) {
  const t = useTranslations('products')
  const locale = useLocale()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [allLabels, setAllLabels] = useState<Label[]>([])
  const [isLoadingLabels, setIsLoadingLabels] = useState(false)
  const description = product ? getProductDescriptionForLocale(product, locale) : ''
  const productName = product ? getProductNameForLocale(product, locale) : ''
  const unitLabel = product ? getUnitLabel(product.unitType, locale) : ''
  const primaryImagePath = product?.imagePaths?.[0] || product?.imagePath || null

  // Get labels for this product
  const productLabels = allLabels.filter(
    (label) => product?.labels?.includes(label.slug)
  )

  useEffect(() => {
    const loadImage = async () => {
      if (!primaryImagePath) {
        setImageUrl(null)
        return
      }

      setIsLoadingImage(true)
      try {
        const url = await getProductImageUrl(primaryImagePath)
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
  }, [open, primaryImagePath, product])

  // Load labels when dialog opens
  useEffect(() => {
    const loadLabels = async () => {
      if (!product?.labels?.length) return
      
      setIsLoadingLabels(true)
      try {
        const labels = await listLabels()
        setAllLabels(labels)
      } catch (error) {
        console.error('Failed to load labels:', error)
      } finally {
        setIsLoadingLabels(false)
      }
    }

    if (open && product) {
      loadLabels()
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
                alt={productName || 'Product'}
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
            {/* Pricing */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Base Price */}
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

              {/* Special Price - only show if provided */}
              {specialPrice != null && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Tag className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'de' ? 'Sonderpreis' : 'Special Price'}
                    </p>
                    <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      €{specialPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'de' ? 'pro' : 'per'} {unitLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
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
            )}

            {/* Labels */}
            {isLoadingLabels ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : productLabels.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Tags className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      {locale === 'de' ? 'Kategorien' : 'Categories'}
                    </p>
                    <div className="space-y-3">
                      {productLabels.map((label) => {
                        const labelName = getLabelDisplayName(label, locale)
                        const labelDescription = getLabelDescription(label, locale)
                        return (
                          <div key={label.id} className="border-l-2 border-primary/30 pl-3">
                            <p className="font-medium text-sm">{labelName}</p>
                            {labelDescription && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {labelDescription}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

