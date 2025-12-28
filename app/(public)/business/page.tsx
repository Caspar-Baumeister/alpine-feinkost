import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  CheckCircle,
  Package,
  Store,
  MapPin,
  Truck,
  Users,
  Mail,
  Phone,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// Image paths - can be updated later when assets are available
const IMAGE_PATHS = {
  sortiment: '/alpinefeinkostlabel.png', // Placeholder - will be replaced with landscape sortiment image
  team: '/alpinefeinkostlabel.png' // Placeholder - will be replaced with team photo
}

// Icon mapping for key points
const KEY_POINT_ICONS = {
  quality: CheckCircle,
  sortiment: Package,
  markets: Store,
  regional: MapPin,
  logistics: Truck,
  service: Users
} as const

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.business')
  
  return {
    title: `${t('title')} | Alpine Feinkost`,
    description: t('intro')
  }
}

export default async function BusinessPage() {
  const t = await getTranslations('marketing.business')

  const keyPoints = [
    { key: 'quality', icon: KEY_POINT_ICONS.quality },
    { key: 'sortiment', icon: KEY_POINT_ICONS.sortiment },
    { key: 'markets', icon: KEY_POINT_ICONS.markets },
    { key: 'regional', icon: KEY_POINT_ICONS.regional },
    { key: 'logistics', icon: KEY_POINT_ICONS.logistics },
    { key: 'service', icon: KEY_POINT_ICONS.service }
  ] as const

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6">
      {/* Hero / Intro Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {t('kicker')}
          </p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl lg:text-5xl">
            {t('title')}
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">{t('intro')}</p>
        </div>

        {/* Sortiment Landscape Image */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
          <Image
            src={IMAGE_PATHS.sortiment}
            alt={t('title')}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            className="object-contain p-8"
            priority
          />
        </div>
      </div>

      {/* Key Points Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          {t('keyPoints.title')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keyPoints.map(({ key, icon: Icon }) => (
            <Card
              key={key}
              className="relative overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/60" />
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t(`keyPoints.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`keyPoints.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
          <Image
            src={IMAGE_PATHS.team}
            alt={t('team.title')}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {t('team.title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{t('team.description')}</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {t('contact.title')}
          </h2>
          <p className="text-muted-foreground">{t('contact.description')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Alpenkäse Lämmle</p>
                    <p className="text-sm text-muted-foreground">{t('contact.address')}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <Link
                    href={`mailto:${t('contact.email')}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t('contact.email')}
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <Link
                    href={`tel:${t('contact.phone').replace(/\s/g, '')}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t('contact.phone')}
                  </Link>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">{t('contact.hours')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  {t('contact.ctaTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.ctaDescription')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`mailto:${t('contact.email')}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {t('contact.emailButton')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`tel:${t('contact.phone').replace(/\s/g, '')}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {t('contact.phoneButton')}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

