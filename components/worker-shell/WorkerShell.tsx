'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signOut } from 'firebase/auth'
import { ClipboardList, LogOut, Loader2, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { auth } from '@/lib/firebase'
import { useViewModeStore } from '@/stores/useViewModeStore'
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
import { ThemeToggle } from '@/components/theme-toggle'
import { ViewSwitcher } from '@/components/view-switcher'
import { AppUser } from '@/lib/firestore/types'
import { canSwitchToWorkerView } from '@/lib/auth/types'
import styles from './WorkerShell.module.css'

interface WorkerShellProps {
  children: ReactNode
  user: AppUser
}

export function WorkerShell({ children, user }: WorkerShellProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { setViewMode } = useViewModeStore()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Check if user can switch views (admin or superadmin)
  const canSwitch = canSwitchToWorkerView(user.role)

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

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await signOut(auth)
      // Wait a moment for auth state to update
      await new Promise((resolve) => setTimeout(resolve, 100))
      router.replace('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const handleViewSwitch = () => {
    setViewMode('admin')
    router.push('/admin')
  }

  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Signing out...</p>
        </div>
      </div>
    )
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
          <div className="h-9 w-9 rounded-lg bg-white p-0.5 flex-shrink-0">
            <Image src="/alpinefeinkostlabel.png" alt="Alpine Feinkost" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <span className={styles.logoText}>{t('app.title')}</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* View Switcher - only for admin/superadmin */}
          {canSwitch && (
            <ViewSwitcher
              currentView="worker"
              onSwitch={handleViewSwitch}
            />
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

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
              {canSwitch && (
                <>
                  <DropdownMenuItem onClick={handleViewSwitch}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('viewSwitch.switchToAdmin')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleSignOut}
                disabled={isSigningOut}
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
