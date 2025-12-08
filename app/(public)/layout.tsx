import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PublicHeader } from '@/components/public-site/public-header'
import { PublicFooter } from '@/components/public-site/public-footer'

export const metadata: Metadata = {
  title: 'Alpine Feinkost | Alpenkäse Lämmle',
  description:
    'Feinster Alpenkäse für Wochenmärkte und Genießer. Entdecken Sie unser Sortiment und erfahren Sie, wo Sie uns finden.'
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}

