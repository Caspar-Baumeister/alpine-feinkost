import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Mail, MapPin, Phone } from 'lucide-react'

export async function PublicFooter() {
  const t = await getTranslations('marketing.footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-muted/30 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground">Alpine Feinkost</p>
          <p className="max-w-md leading-relaxed">{t('tagline')}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Lichterfelder Allee 127 · 14513 Teltow</span>
          </div>
        </div>

        <div className="grid flex-1 gap-6 sm:grid-cols-2 md:max-w-xl">
          <div className="space-y-3">
            <p className="text-foreground font-medium">{t('contactTitle')}</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Link href="mailto:info@alpinefeinkost.de" className="hover:text-primary">
                info@alpinefeinkost.de
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <Link href="tel:+4915679070067" className="hover:text-primary">
                +49 15679 070067
              </Link>
            </div>
            <Link href="/kontakt" className="inline-flex text-foreground hover:text-primary">
              {t('contactLink')}
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-foreground font-medium">{t('linksTitle')}</p>
            <div className="flex flex-col gap-2">
              <Link href="/sortiment" className="hover:text-primary">
                {t('sortiment')}
              </Link>
              <Link href="/about" className="hover:text-primary">
                {t('about')}
              </Link>
              <Link href="/kontakt" className="hover:text-primary">
                {t('contact')}
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-primary">
                {t('admin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {year} Alpine Feinkost · {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}

