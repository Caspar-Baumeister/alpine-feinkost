import { ProductCard } from '@/components/public-site/product-card'
import { ProductImageCutout } from '@/components/public-site/product-image-cutout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPublicCatalog } from '@/lib/public/catalog'
import { ArrowRight, Leaf, Sparkles } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import heroStyles from './components/hero.module.css'

export default async function LandingPage() {
  const locale = (await getLocale()) as 'de' | 'en'
  const t = await getTranslations('marketing')
  const { products, labels } = await getPublicCatalog()
  const labelsBySlug = new Map(labels.map((label) => [label.slug, label]))
  const featuredProducts = products.filter((p) => p.isActive).slice(0, 3)

  return (
    <div className="pb-16">
      {/* Hero Section with Background Image - Full Screen */}
      <section className="relative h-[120vh] overflow-hidden -mt-16">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/background.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            quality={90}
            style={{ objectPosition: 'center top' }}
          />
        </div>

        {/* Gradient Scrim Overlay for Readability - prevents white box artifacts */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-white/8 via-white/5 to-transparent" />

        {/* Radial Glow Behind Content (Primary Blue) */}
        <div className="absolute left-1/2 top-1/3 h-96 w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />

        {/* Bottom Fade to White - Starts later, taller gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-background via-background/90 via-background/50 to-transparent sm:h-[28rem]" />

        {/* Content Container - Centered in viewport */}
        <div className="relative z-10 mx-auto flex h-screen max-w-6xl flex-col justify-center px-4 pt-20 sm:px-6 md:pt-24">
          <div className="mx-auto w-full max-w-3xl space-y-5 text-center md:space-y-6">
            {/* Eyebrow Badge */}
            <Badge className="gap-1.5 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider text-primary backdrop-blur-sm ring-1 ring-primary/20 md:text-sm">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {t('hero.badge')}
            </Badge>

            {/* Premium Headline - Traditional Display Serif */}
            <h1 className={`${heroStyles.heroHeadline} mx-auto max-w-4xl text-[32px] sm:text-[44px] md:text-[56px] lg:text-[64px]`}>
              {t('hero.title')}
            </h1>

            {/* Elegant Subheadline */}
            <p className={`${heroStyles.heroSubheadline} mx-auto max-w-2xl text-base sm:text-lg md:text-xl`}>
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-1 md:gap-4 md:pt-2">
              <Button asChild size="lg" className="font-medium shadow-lg">
                <Link href="/sortiment" className="inline-flex items-center gap-2">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-primary/20 bg-white/70 font-medium backdrop-blur-sm shadow-md transition-all hover:border-primary/30 hover:bg-white/85"
              >
                <Link href="/kontakt" className="inline-flex items-center gap-2">
                  {t('hero.ctaSecondary')}
                </Link>
              </Button>
            </div>

            {/* Promise Microcopy */}
            <div className="flex items-center justify-center gap-2.5 pt-1 text-sm text-[#3a4a5c]/85 md:gap-3 md:text-base">
              <Leaf className="h-4 w-4 text-primary md:h-5 md:w-5" />
              <span>{t('hero.promise')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Continuation Gradient for Perfect Transition */}
      <div className="relative -mt-1 h-8 bg-gradient-to-b from-transparent to-background" />

      {/* Product Impressions Section */}
      <section className="mx-auto max-w-6xl space-y-6 px-4 pt-16 sm:px-6 sm:pt-20">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {t('productImpressions.title')}
          </p>
          <p className="text-muted-foreground">{t('productImpressions.subtitle')}</p>
        </div>

        {/* Desktop: 4-up grid */}
        <div className="hidden grid-cols-4 gap-8 md:grid">
          <ProductImageCutout
            src="/products1.png"
            alt={locale === 'de' ? 'Alpenkäse Spezialität 1' : 'Alpine cheese specialty 1'}
            href="/sortiment"
            priority
          />
          <ProductImageCutout
            src="/products2.png"
            alt={locale === 'de' ? 'Alpenkäse Spezialität 2' : 'Alpine cheese specialty 2'}
            href="/sortiment"
          />
          <ProductImageCutout
            src="/products3.png"
            alt={locale === 'de' ? 'Alpenkäse Spezialität 3' : 'Alpine cheese specialty 3'}
            href="/sortiment"
          />
          <ProductImageCutout
            src="/products4.png"
            alt={locale === 'de' ? 'Alpenkäse Spezialität 4' : 'Alpine cheese specialty 4'}
            href="/sortiment"
          />
        </div>

        {/* Mobile: Scrollable row */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide md:hidden">
          <div className="min-w-[200px] flex-shrink-0">
            <ProductImageCutout
              src="/products1.png"
              alt={locale === 'de' ? 'Alpenkäse Spezialität 1' : 'Alpine cheese specialty 1'}
              href="/sortiment"
              priority
              sizes="200px"
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <ProductImageCutout
              src="/products2.png"
              alt={locale === 'de' ? 'Alpenkäse Spezialität 2' : 'Alpine cheese specialty 2'}
              href="/sortiment"
              sizes="200px"
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <ProductImageCutout
              src="/products3.png"
              alt={locale === 'de' ? 'Alpenkäse Spezialität 3' : 'Alpine cheese specialty 3'}
              href="/sortiment"
              sizes="200px"
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <ProductImageCutout
              src="/products4.png"
              alt={locale === 'de' ? 'Alpenkäse Spezialität 4' : 'Alpine cheese specialty 4'}
              href="/sortiment"
              sizes="200px"
            />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button asChild variant="outline">
            <Link href="/sortiment" className="inline-flex items-center gap-2">
              {t('productImpressions.cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
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

