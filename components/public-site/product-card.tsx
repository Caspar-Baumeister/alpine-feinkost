import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Product, Label } from '@/lib/firestore'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'
import { getLabelDescription } from '@/lib/labels/getLabelDescription'
import { getPublicStorageUrl } from '@/lib/storage/publicUrl'
import { getProductDescriptionForLocale } from '@/lib/products/getProductDescriptionForLocale'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getUnitLabelForLocale } from '@/lib/products/getUnitLabelForLocale'

type ProductCardProps = {
  product: Product
  locale: 'de' | 'en'
  labelsBySlug?: Map<string, Label>
  showLearnMore?: boolean
  learnMoreHref?: string
  comingSoonLabel?: string
  learnMoreLabel?: string
}

function formatPrice(value: number, locale: 'de' | 'en') {
  const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR'
  })

  return formatter.format(value)
}

export function ProductCard({
  product,
  locale,
  labelsBySlug,
  showLearnMore = false,
  learnMoreHref,
  comingSoonLabel,
  learnMoreLabel
}: ProductCardProps) {
  const productLabels =
    labelsBySlug?.size && product.labels.length
      ? product.labels
          .map((slug) => labelsBySlug.get(slug))
          .filter(Boolean)
          .map((label) => label as Label)
      : []
  const imageUrl = getPublicStorageUrl(product.imagePath)
  const unitLabel =
    getUnitLabelForLocale(product, locale)
  const productName = getProductNameForLocale(product, locale)

  return (
    <Card className="h-full overflow-hidden border-border/70 bg-card shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-500/20 via-background to-background">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {productName || 'Alpine Feinkost'}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold leading-tight text-foreground">
              {productName}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {getProductDescriptionForLocale(product, locale)}
            </p>
          </div>
          {comingSoonLabel ? (
            <Badge variant="secondary" className="whitespace-nowrap">
              {comingSoonLabel}
            </Badge>
          ) : null}
        </div>

        {productLabels.length ? (
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              {productLabels.map((label) => {
                const description = getLabelDescription(label, locale)
                return (
                  <Tooltip key={label.slug}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">
                        {getLabelDisplayName(label, locale)}
                      </Badge>
                    </TooltipTrigger>
                    {description ? (
                      <TooltipContent side="top" align="start" className="max-w-xs whitespace-pre-line">
                        {description}
                      </TooltipContent>
                    ) : null}
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
        ) : null}

        <div className="text-sm font-medium text-foreground">
          {formatPrice(product.basePrice, locale)}{' '}
          <span className="text-muted-foreground">/ {unitLabel}</span>
        </div>

        {showLearnMore && learnMoreHref ? (
          <div>
            <Link
              href={learnMoreHref}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              {learnMoreLabel || 'Mehr erfahren'}
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

