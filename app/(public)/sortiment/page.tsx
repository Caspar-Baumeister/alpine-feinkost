import { getLocale, getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/public-site/product-card'
import { getPublicCatalog } from '@/lib/public/catalog'

export default async function SortimentPage() {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('marketing.sortiment')
  const tProducts = await getTranslations('marketing.products')
  const { products, labels } = await getPublicCatalog()
  const labelsBySlug = new Map(labels.map((label) => [label.slug, label]))
  const activeProducts = products.filter((product) => product.isActive)

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

      {activeProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              labelsBySlug={labelsBySlug}
              comingSoonLabel={tProducts('comingSoon')}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
          {t('empty')}
        </div>
      )}
    </div>
  )
}

