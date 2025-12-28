'use client'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { key: 'home', href: '/' },
  { key: 'sortiment', href: '/sortiment' },
  { key: 'about', href: '/about' },
  { key: 'business', href: '/business' },
  { key: 'contact', href: '/kontakt' }
]

export function PublicHeader() {
  const t = useTranslations('marketing.nav')
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/20 bg-transparent backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              AF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm uppercase tracking-wide text-foreground/80 drop-shadow-sm">
                Alpenkäse Lämmle
              </span>
              <span className="text-base font-semibold text-foreground drop-shadow-sm">Alpine Feinkost</span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'transition-colors hover:text-primary drop-shadow-sm',
                isActive(item.href) ? 'text-primary font-semibold' : 'text-foreground/90'
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex bg-background/80 backdrop-blur-sm border-border/40">
            <Link href="/login">{t('admin')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground/90"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? t('closeMenu') : t('openMenu')}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'border-t border-border/20 bg-background/95 backdrop-blur-md px-4 sm:px-6 md:hidden',
          isOpen ? 'block' : 'hidden'
        )}
      >
        <div className="flex flex-col gap-3 py-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={closeMenu}
              className={cn(
                'rounded-md px-2 py-2 transition-colors hover:bg-muted',
                isActive(item.href) ? 'text-primary' : 'text-foreground'
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link href="/login" onClick={closeMenu}>
              {t('admin')}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

