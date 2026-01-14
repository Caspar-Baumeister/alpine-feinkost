import { ProductCard } from '@/components/public-site/product-card'
import { ProductImageCutout } from '@/components/public-site/product-image-cutout'
import { SortimentFilters } from './sortiment-filters'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicCatalog } from '@/lib/public/catalog'
import { getLabelDisplayName } from '@/lib/labels/getLabelDisplayName'
import { getProductNameForLocale } from '@/lib/products/getProductNameForLocale'
import { getLocale, getTranslations } from 'next-intl/server'

interface PageProps {
  searchParams: Promise<{ label?: string; q?: string }>
}

export default async function SortimentPage({ searchParams }: PageProps) {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('marketing.sortiment')
  const tProducts = await getTranslations('marketing.products')
  const { products, labels } = await getPublicCatalog()
  const labelsBySlug = new Map(labels.map((label) => [label.slug, label]))

  const resolvedParams = await searchParams
  const labelFilter = resolvedParams?.label || null
  const queryFilter = resolvedParams?.q || null

  // Get label display name for filter badge
  const filterLabel = labelFilter ? labelsBySlug.get(labelFilter) : null
  const filterLabelName = filterLabel ? getLabelDisplayName(filterLabel, locale) : labelFilter

  // Filter products
  let filteredProducts = products.filter((product) => product.isActive)

  // Filter by label
  if (labelFilter) {
    filteredProducts = filteredProducts.filter((product) =>
      product.labels.includes(labelFilter)
    )
  }

  // Filter by search query
  if (queryFilter) {
    const queryLower = queryFilter.toLowerCase()
    filteredProducts = filteredProducts.filter((product) => {
      const name = getProductNameForLocale(product, locale).toLowerCase()
      return name.includes(queryLower)
    })
  }

  const hasFilters = labelFilter || queryFilter

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {t('kicker')}
          </p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t('title')}</h1>
          <p className="max-w-2xl text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {t('comingSoon')}
        </Badge>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <SortimentFilters
          labelFilter={labelFilter}
          labelName={filterLabelName}
          queryFilter={queryFilter}
          filterByLabelText={t('filterByLabel')}
          searchForText={t('searchFor')}
          clearFilterText={t('clearFilter')}
        />
      )}

      {/* Visual Overview Gallery */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {t('visualOverview.title')}
          </h2>
          <p className="text-muted-foreground">{t('visualOverview.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-border/70 bg-gradient-to-br from-primary/3 via-background to-background shadow-sm">
            <CardContent className="flex items-center justify-center p-8">
              <ProductImageCutout
                src="/products1.png"
                alt={locale === 'de' ? 'Alpenkäse Spezialität 1' : 'Alpine cheese specialty 1'}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-gradient-to-br from-primary/3 via-background to-background shadow-sm">
            <CardContent className="flex items-center justify-center p-8">
              <ProductImageCutout
                src="/products2.png"
                alt={locale === 'de' ? 'Alpenkäse Spezialität 2' : 'Alpine cheese specialty 2'}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-gradient-to-br from-primary/3 via-background to-background shadow-sm">
            <CardContent className="flex items-center justify-center p-8">
              <ProductImageCutout
                src="/products3.png"
                alt={locale === 'de' ? 'Alpenkäse Spezialität 3' : 'Alpine cheese specialty 3'}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-gradient-to-br from-primary/3 via-background to-background shadow-sm">
            <CardContent className="flex items-center justify-center p-8">
              <ProductImageCutout
                src="/products4.png"
                alt={locale === 'de' ? 'Alpenkäse Spezialität 4' : 'Alpine cheese specialty 4'}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {filteredProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              labelsBySlug={labelsBySlug}
              comingSoonLabel={tProducts('comingSoon')}
              showLearnMore
              learnMoreHref={`/sortiment/${product.id}`}
              learnMoreLabel={tProducts('learnMore')}
            />
          ))}
        </div>
      ) : hasFilters ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
          {t('noMatchingProducts')}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
          {t('empty')}
        </div>
      )}
    </div>
  )
}

