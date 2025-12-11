'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ProductUnitType } from '@/lib/firestore'
import { getPublicStorageUrl } from '@/lib/storage/publicUrl'
import { cn } from '@/lib/utils'

type LabelDisplay = {
  slug: string
  name: string
  description: string
}

type MarketDisplay = {
  id: string
  name: string
  location?: string
  notes?: string
}

type ProductForDisplay = {
  id: string
  name: string
  description: string
  basePrice: number
  unitType: ProductUnitType | string
  unitLabel: string
  imagePaths: string[]
}

type ProductDetailContentProps = {
  product: ProductForDisplay
  labels: LabelDisplay[]
  markets: MarketDisplay[]
  locale: 'de' | 'en'
  strings: {
    back: string
    descriptionTitle: string
    labelsTitle: string
    labelsEmpty: string
    availabilityTitle: string
    availabilityPlaceholder: string
    availabilityEmpty: string
    addToCartTitle: string
    sizeLabel: string
    quantityLabel: string
    addToCartCta: string
    cartSoon: string
    sizeLabels: {
      g250: string
      g400: string
      g500: string
      kg1: string
      piece1: string
      piece2: string
      half: string
      whole: string
    }
  }
}

type ImageSource = {
  path: string
  url: string
}

function formatPrice(value: number, locale: 'de' | 'en') {
  const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR'
  })

  return formatter.format(value)
}

function buildSizeOptions(unitType: ProductUnitType | string, strings: ProductDetailContentProps['strings']) {
  const isWeight = unitType === 'kg' || unitType === 'g' || unitType === 'weight'
  if (isWeight) {
    return [
      { value: '250g', label: strings.sizeLabels.g250 },
      { value: '400g', label: strings.sizeLabels.g400 },
      { value: '500g', label: strings.sizeLabels.g500 },
      { value: '1kg', label: strings.sizeLabels.kg1 }
    ]
  }

  return [
    { value: '1-piece', label: strings.sizeLabels.piece1 },
    { value: '2-piece', label: strings.sizeLabels.piece2 },
    { value: 'half', label: strings.sizeLabels.half },
    { value: 'whole', label: strings.sizeLabels.whole }
  ]
}

export function ProductDetailContent({
  product,
  labels,
  markets,
  locale,
  strings
}: ProductDetailContentProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)

  const images: ImageSource[] = useMemo(() => {
    const paths = product.imagePaths?.length ? product.imagePaths : []
    return paths
      .map((path) => ({ path, url: getPublicStorageUrl(path) }))
      .filter((entry): entry is ImageSource => Boolean(entry.url))
  }, [product.imagePaths])

  const sizeOptions = useMemo(
    () => buildSizeOptions(product.unitType, strings),
    [product.unitType, strings]
  )

  useEffect(() => {
    if (!selectedSize && sizeOptions.length) {
      setSelectedSize(sizeOptions[0].value)
    }
  }, [sizeOptions, selectedSize])

  const handleSelectSize = useCallback((value: string) => {
    setSelectedSize(value)
  }, [])

  const handleQuantityChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      setQuantity(1)
      return
    }
    setQuantity(parsed)
  }, [])

  const handleAddToCart = useCallback(() => {
    setFeedback(strings.cartSoon)
  }, [strings.cartSoon])

  const mainImage = images[selectedImageIdx]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/sortiment" className="hover:text-primary">
          {strings.back}
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/70 bg-muted/30">
            <div className="relative aspect-square w-full bg-gradient-to-br from-emerald-500/10 via-background to-background">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {product.name}
                </div>
              )}
            </div>
          </Card>

          {images.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image.path}
                  type="button"
                  onClick={() => setSelectedImageIdx(index)}
                  className={cn(
                    'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition',
                    selectedImageIdx === index
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-border/70 hover:border-primary/60'
                  )}
                  aria-label={`${product.name} thumbnail ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-primary/80">Alpine Feinkost</p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <div className="text-xl font-semibold text-foreground">
              {formatPrice(product.basePrice, locale)}{' '}
              <span className="text-muted-foreground">/ {product.unitLabel}</span>
            </div>
            <p className="text-base text-muted-foreground">{product.description}</p>
            {labels.length ? (
              <TooltipProvider delayDuration={100}>
                <div className="flex flex-wrap gap-2 pt-2">
                  {labels.map((label) => (
                    <Tooltip key={label.slug}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline">{label.name}</Badge>
                      </TooltipTrigger>
                      {label.description ? (
                        <TooltipContent side="top" align="start" className="max-w-xs whitespace-pre-line">
                          {label.description}
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            ) : null}
          </div>

          <Card className="border-border/70 bg-card shadow-sm">
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{strings.addToCartTitle}</p>
                  <p className="text-sm text-muted-foreground">{product.unitLabel}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {strings.cartSoon}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">{strings.sizeLabel}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectSize(option.value)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium transition',
                        selectedSize === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/70 bg-card hover:border-primary/60'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{strings.quantityLabel}</p>
                <div className="flex w-28 items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="text-center"
                  />
                </div>
              </div>

              <Button onClick={handleAddToCart} className="w-full">
                {strings.addToCartCta}
              </Button>

              {feedback ? (
                <p className="text-sm text-muted-foreground">{feedback}</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">{strings.descriptionTitle}</h2>
          <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{strings.labelsTitle}</h2>

          {labels.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {labels.map((label) => (
                <Card key={label.slug} className="border-border/70 bg-card/60 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{label.name}</p>
                      {label.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{label.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{strings.labelsEmpty}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{strings.labelsEmpty}</p>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{strings.availabilityTitle}</h2>

          {markets.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {markets.map((market) => (
                <Card key={market.id} className="border-border/70 bg-card/60 p-4 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">{market.name}</p>
                    {market.location ? (
                      <p className="text-sm text-muted-foreground">{market.location}</p>
                    ) : null}
                    {market.notes ? (
                      <p className="text-sm text-muted-foreground">{market.notes}</p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              {strings.availabilityPlaceholder || strings.availabilityEmpty}
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

