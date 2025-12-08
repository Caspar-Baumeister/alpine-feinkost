import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Product, Label } from '@/lib/firestore'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'

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
          .map((label) => getLabelDisplayName(label as Label, locale))
      : []

  return (
    <Card className="h-full overflow-hidden border-border/70 bg-card shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-500/20 via-background to-background">
        {product.imagePath ? (
          <Image
            src={product.imagePath}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {product.name}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold leading-tight text-foreground">
              {product.name}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          </div>
          {comingSoonLabel ? (
            <Badge variant="secondary" className="whitespace-nowrap">
              {comingSoonLabel}
            </Badge>
          ) : null}
        </div>

        {productLabels.length ? (
          <div className="flex flex-wrap gap-2">
            {productLabels.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="text-sm font-medium text-foreground">
          {formatPrice(product.basePrice, locale)}{' '}
          <span className="text-muted-foreground">/ {product.unitLabel}</span>
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

