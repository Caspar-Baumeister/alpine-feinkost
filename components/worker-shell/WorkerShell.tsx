'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ClipboardList, Mountain, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher/LanguageSwitcher'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AppUser } from '@/lib/firestore/types'
import styles from './WorkerShell.module.css'

interface WorkerShellProps {
  children: ReactNode
  user: AppUser
}

export function WorkerShell({ children, user }: WorkerShellProps) {
  const t = useTranslations()
  const pathname = usePathname()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header
        className={cn(
          styles.topbar,
          'flex items-center justify-between px-4 bg-background/80'
        )}
      >
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Mountain className="h-6 w-6 text-emerald-500" />
          <span className={styles.logoText}>{t('app.title')}</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-sm">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                {t('user.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => signOut(auth)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={cn(styles.navTabs, 'py-3 bg-card/50')}>
        <Link
          href="/app"
          className={cn(styles.navTab, isActive('/app') && styles.active)}
        >
          <ClipboardList className="h-4 w-4" />
          {t('nav.myPacklists')}
        </Link>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}

