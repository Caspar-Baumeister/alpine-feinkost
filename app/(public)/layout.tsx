import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getLocale } from 'next-intl/server'
import { PublicHeader } from '@/components/public-site/public-header'
import { PublicFooter } from '@/components/public-site/public-footer'
import { LightThemeProvider } from '@/components/public-site/light-theme-provider'
import { getPublicCatalog } from '@/lib/public/catalog'
import { buildSearchIndex } from '@/lib/public/search-index'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const ogImagePath = '/opengraph-image.png'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Alpine Feinkost | Alpenkäse Lämmle',
  description:
    'Feinster Alpenkäse für Wochenmärkte und Genießer. Entdecken Sie unser Sortiment und erfahren Sie, wo Sie uns finden.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png'
  },
  openGraph: {
    title: 'Alpine Feinkost | Alpenkäse Lämmle',
    description:
      'Feinster Alpenkäse für Wochenmärkte und Genießer. Entdecken Sie unser Sortiment und erfahren Sie, wo Sie uns finden.',
    url: siteUrl,
    siteName: 'Alpine Feinkost | Alpenkäse Lämmle',
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: 'Alpine Feinkost Logo'
      }
    ],
    locale: 'de_DE',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpine Feinkost | Alpenkäse Lämmle',
    description:
      'Feinster Alpenkäse für Wochenmärkte und Genießer. Entdecken Sie unser Sortiment und erfahren Sie, wo Sie uns finden.',
    images: [ogImagePath]
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as 'de' | 'en'
  const { products, labels } = await getPublicCatalog()
  const searchIndex = buildSearchIndex(products, labels)

  return (
    <LightThemeProvider className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader searchIndex={searchIndex} locale={locale} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </LightThemeProvider>
  )
}

