import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function KontaktPage() {
  const t = await getTranslations('marketing.contact')

  const locationKeys = ['teltow', 'potsdam', 'berlin'] as const
  const locations = locationKeys.map((key) => ({
    key,
    name: t(`locations.${key}.name`),
    address: t(`locations.${key}.address`),
    schedule: t(`locations.${key}.schedule`)
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">{t('kicker')}</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="max-w-2xl text-muted-foreground">{t('intro')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">{t('contactTitle')}</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Alpenkäse Lämmle</p>
                <p>Lichterfelder Allee 127</p>
                <p>14513 Teltow</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <Link href="mailto:info@alpinefeinkost.de" className="hover:text-primary">
                info@alpinefeinkost.de
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary" />
              <Link href="tel:+4915679070067" className="hover:text-primary">
                +49 15679 070067
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('contactNote')}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-foreground">{t('locationsTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('locationsIntro')}</p>
          <div className="mt-4 space-y-3">
            {locations.map((location) => (
              <div
                key={location.key}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{location.name}</p>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {t('marketsBadge')}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{location.schedule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

