import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { getLabelBySlug } from '@/lib/firestore/labels'
import { getPos } from '@/lib/firestore/pos'
import { getProduct } from '@/lib/firestore/products'
import { Label, Pos, Product } from '@/lib/firestore/types'
import { getLabelDescription } from '@/lib/labels/getLabelDescription'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getUnitLabelForLocale } from '@/lib/products/getUnitLabelForLocale'
import { ProductDetailContent } from './ProductDetailContent'

type PageParams = {
  productId?: string
}

type ProductForDisplay = {
  id: string
  name: string
  description: string
  basePrice: number
  unitType: Product['unitType']
  unitLabel: string
  imagePaths: string[]
}

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

function getDescriptionWithFallback(product: Product, locale: 'de' | 'en') {
  if (locale === 'de') {
    return product.descriptionDe || product.descriptionEn || ''
  }
  return product.descriptionEn || product.descriptionDe || ''
}

async function fetchLabels(slugs: string[], locale: 'de' | 'en'): Promise<LabelDisplay[]> {
  if (!slugs.length) return []
  const fetched = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await getLabelBySlug(slug)
      } catch (error) {
        console.error('Failed to fetch label', slug, error)
        return null
      }
    })
  )
  return fetched
    .filter(Boolean)
    .map((label) => label as Label)
    .map((label) => ({
      slug: label.slug,
      name: getLabelDisplayName(label, locale),
      description: getLabelDescription(label, locale) || ''
    }))
}

async function fetchMarkets(ids: string[] | null | undefined): Promise<MarketDisplay[]> {
  if (!ids?.length) return []
  const fetched = await Promise.all(
    ids.map(async (id) => {
      try {
        return await getPos(id)
      } catch (error) {
        console.error('Failed to fetch pos', id, error)
        return null
      }
    })
  )

  return fetched
    .filter((pos): pos is Pos => Boolean(pos && pos.active))
    .map((pos) => ({
      id: pos.id,
      name: pos.name,
      location: pos.location,
      notes: pos.notes
    }))
}

export default async function ProductDetailPage({ params }: { params: Promise<PageParams> }) {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('marketing.productDetail')
  const resolvedParams = await params
  const productId = resolvedParams?.productId

  if (!productId || typeof productId !== 'string') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-6">
          <Link href="/sortiment" className="text-sm font-medium text-primary hover:text-primary/80">
            {t('back')}
          </Link>
        </div>
        <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <Badge variant="secondary" className="mx-auto w-fit">
            404
          </Badge>
          <h1 className="text-2xl font-semibold text-foreground">{t('notFoundTitle')}</h1>
          <p className="text-muted-foreground">{t('notFoundSubtitle')}</p>
        </div>
      </div>
    )
  }

  const product = await getProduct(productId).catch((error) => {
    console.error('Failed to fetch product', productId, error)
    return null
  })

  if (!product || !product.isActive) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-6">
          <Link href="/sortiment" className="text-sm font-medium text-primary hover:text-primary/80">
            {t('back')}
          </Link>
        </div>
        <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <Badge variant="secondary" className="mx-auto w-fit">
            404
          </Badge>
          <h1 className="text-2xl font-semibold text-foreground">{t('notFoundTitle')}</h1>
          <p className="text-muted-foreground">{t('notFoundSubtitle')}</p>
        </div>
      </div>
    )
  }

  const imagePaths = product.imagePaths?.length
    ? product.imagePaths
    : (product.imagePath ? [product.imagePath] : [])
  const productForDisplay: ProductForDisplay = {
    id: product.id,
    name: getProductNameForLocale(product, locale),
    description: getDescriptionWithFallback(product, locale),
    basePrice: product.basePrice,
    unitType: product.unitType,
    unitLabel: getUnitLabelForLocale(product, locale),
    imagePaths
  }

  const [labels, markets] = await Promise.all([
    fetchLabels(product.labels, locale),
    fetchMarkets(product.availableAtPosIds ?? null)
  ])

  const strings = {
    back: t('back'),
    notFoundTitle: t('notFoundTitle'),
    notFoundSubtitle: t('notFoundSubtitle'),
    descriptionTitle: t('descriptionTitle'),
    labelsTitle: t('labelsTitle'),
    labelsEmpty: t('labelsEmpty'),
    availabilityTitle: t('availabilityTitle'),
    availabilityPlaceholder: t('availabilityPlaceholder'),
    availabilityEmpty: t('availabilityEmpty'),
    addToCartTitle: t('addToCartTitle'),
    sizeLabel: t('sizeLabel'),
    quantityLabel: t('quantityLabel'),
    addToCartCta: t('addToCartCta'),
    cartSoon: t('cartSoon'),
    sizeLabels: {
      g250: t('sizeLabels.g250'),
      g400: t('sizeLabels.g400'),
      g500: t('sizeLabels.g500'),
      kg1: t('sizeLabels.kg1'),
      piece1: t('sizeLabels.piece1'),
      piece2: t('sizeLabels.piece2'),
      half: t('sizeLabels.half'),
      whole: t('sizeLabels.whole')
    }
  }

  return (
    <ProductDetailContent
      product={productForDisplay}
      labels={labels}
      markets={markets}
      locale={locale}
      strings={strings}
    />
  )
}

