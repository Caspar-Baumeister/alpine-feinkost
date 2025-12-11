import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
