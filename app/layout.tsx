import { ThemeProvider } from '@/components/theme-provider'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Fraunces, Geist_Mono, Inter } from 'next/font/google'
import './globals.css'

// Premium serif for headlines (Alpine delicatessen feel)
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin', 'latin-ext'], // Latin-ext for German umlauts
  weight: ['400', '600', '700'],
  display: 'swap'
})

// Clean sans for body and UI (readability)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'], // Latin-ext for German umlauts
  weight: ['400', '500', '600'],
  display: 'swap'
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const ogImagePath = '/opengraph-image.png'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Alpine Feinkost | Alpenkäse Lämmle',
  description: 'Feinster Alpenkäse für Wochenmärkte, Gastro und Genießer – plus moderne Verwaltung für unser Team.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png'
  },
  openGraph: {
    title: 'Alpine Feinkost | Alpenkäse Lämmle',
    description:
      'Feinster Alpenkäse für Wochenmärkte, Gastro und Genießer – plus moderne Verwaltung für unser Team.',
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
      'Feinster Alpenkäse für Wochenmärkte, Gastro und Genießer – plus moderne Verwaltung für unser Team.',
    images: [ogImagePath]
  }
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
