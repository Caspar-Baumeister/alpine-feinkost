'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'home', href: '/' },
  { key: 'sortiment', href: '/sortiment' },
  { key: 'about', href: '/about' },
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-sm">
              AF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                Alpenkäse Lämmle
              </span>
              <span className="text-base text-foreground">Alpine Feinkost</span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'transition-colors hover:text-primary',
                isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">{t('admin')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? t('closeMenu') : t('openMenu')}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'border-t border-border/60 bg-background/95 px-4 sm:px-6 md:hidden',
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

