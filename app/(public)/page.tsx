import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Leaf, Sparkles } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/public-site/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPublicCatalog } from '@/lib/public/catalog'

export default async function LandingPage() {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('marketing')
  const { products, labels } = await getPublicCatalog()
  const labelsBySlug = new Map(labels.map((label) => [label.slug, label]))
  const featuredProducts = products.filter((p) => p.isActive).slice(0, 3)

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col-reverse gap-10 px-4 py-12 sm:px-6 md:flex-row md:items-center md:py-16">
          <div className="flex-1 space-y-6">
            <Badge className="gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
              <Sparkles className="h-4 w-4" />
              {t('hero.badge')}
            </Badge>
            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{t('hero.subtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sortiment" className="inline-flex items-center gap-2">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/kontakt" className="inline-flex items-center gap-2">
                  {t('hero.ctaSecondary')}
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-emerald-500" />
              <span>{t('hero.promise')}</span>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
              <Image
                src="/alpinefeinkostlabel.png"
                alt="Alpine Feinkost"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {t('featured.kicker')}
            </p>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {t('featured.title')}
            </h2>
            <p className="text-muted-foreground">{t('featured.subtitle')}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/sortiment">{t('featured.viewAll')}</Link>
          </Button>
        </div>

        {featuredProducts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                labelsBySlug={labelsBySlug}
                showLearnMore
                learnMoreHref="/sortiment"
                learnMoreLabel={t('products.learnMore')}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            {t('featured.empty')}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl grid items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {t('aboutTeaser.kicker')}
          </p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {t('aboutTeaser.title')}
          </h2>
          <p className="text-muted-foreground">{t('aboutTeaser.body')}</p>
          <Button asChild>
            <Link href="/about">{t('aboutTeaser.cta')}</Link>
          </Button>
        </div>
        <div className="relative h-full">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-amber-400/20 via-background to-background shadow-lg">
            <Image
              src="/alpinefeinkostlabel.png"
              alt="Alpenkäse Lämmle"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-2xl border border-border/60 bg-muted/40 px-4 py-10 sm:px-6 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {t('contactTeaser.kicker')}
            </p>
            <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
              {t('contactTeaser.title')}
            </h3>
            <p className="text-muted-foreground">{t('contactTeaser.body')}</p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/kontakt" className="inline-flex items-center gap-2">
              {t('contactTeaser.cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

