'use client'

import { ReactNode, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signOut } from 'firebase/auth'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  ClipboardList,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Loader2,
  BarChart3,
  UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { auth } from '@/lib/firebase'
import { useSidebarStore } from '@/stores/useSidebarStore'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { ViewSwitcher } from '@/components/view-switcher'
import { AppUser } from '@/lib/firestore/types'
import { canAccessStatistics, canAccessUserManagement, canSwitchToWorkerView } from '@/lib/auth/types'
import styles from './AdminShell.module.css'

interface AdminShellProps {
  children: ReactNode
  user: AppUser
}

interface NavItem {
  href: string
  labelKey: string
  icon: typeof LayoutDashboard
  superadminOnly?: boolean
}

const allNavItems: NavItem[] = [
  { href: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/admin/lagerbestand', labelKey: 'nav.lagerbestand', icon: Package },
  { href: '/admin/products', labelKey: 'nav.products', icon: ShoppingBag },
  { href: '/admin/pos', labelKey: 'nav.pos', icon: Store },
  { href: '/admin/packlists', labelKey: 'nav.packlists', icon: ClipboardList },
  { href: '/admin/templates', labelKey: 'nav.templates', icon: FileText },
  { href: '/admin/statistics', labelKey: 'nav.statistics', icon: BarChart3, superadminOnly: true },
  { href: '/admin/settings/users', labelKey: 'nav.users', icon: Users, superadminOnly: true }
]

export function AdminShell({ children, user }: AdminShellProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed, toggleSidebar } = useSidebarStore()
  const { viewMode, setViewMode } = useViewModeStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Filter navigation items based on user role
  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (item.superadminOnly) {
        return user.role === 'superadmin'
      }
      return true
    })
  }, [user.role])

  // Check if user can switch views
  const canSwitch = canSwitchToWorkerView(user.role)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    setMobileMenuOpen(false)

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
    if (viewMode === 'admin') {
      setViewMode('worker')
      router.push('/app')
    } else {
      setViewMode('admin')
      router.push('/admin')
    }
  }

  // Navigation component - reused in both desktop sidebar and mobile drawer
  const NavLinks = ({ showLabels = true, onItemClick }: { showLabels?: boolean; onItemClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        if (!showLabels) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    styles.navItem,
                    active && styles.active,
                    'justify-center mx-3'
                  )}
                >
                  <Icon className={styles.navIcon} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t(item.labelKey)}
              </TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(styles.navItem, active && styles.active)}
          >
            <Icon className={styles.navIcon} />
            <span className={styles.navLabel}>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </>
  )

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
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'bg-card border-r border-border',
            styles.sidebar,
            isCollapsed && styles.collapsed
          )}
        >
          {/* Logo */}
          <div className={styles.logoContainer}>
            <div className="h-10 w-10 rounded-lg bg-white p-1 flex-shrink-0">
              <Image src="/alpinefeinkostlabel.png" alt="Alpine Feinkost" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className={cn('ml-3', styles.logoText)}>
                {t('app.title')}
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <NavLinks showLabels={!isCollapsed} />
          </nav>

          {/* Sidebar Footer with Toggle */}
          <div className="p-3 border-t border-border">
            <button
              onClick={toggleSidebar}
              className={styles.toggleButton}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div
          className={cn(
            styles.mainContent,
            isCollapsed && styles.sidebarCollapsed
          )}
        >
          {/* Top Bar */}
          <header
            className={cn(
              styles.topbar,
              'flex items-center justify-between px-4 lg:px-6 bg-background/80'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={styles.mobileMenuButton}
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-card">
                  <div className={styles.drawerNav}>
                    {/* Drawer Header */}
                    <SheetHeader className="p-0">
                      <div className={styles.logoContainer}>
                        <div className="h-10 w-10 rounded-lg bg-white p-1 flex-shrink-0">
                          <Image src="/alpinefeinkostlabel.png" alt="Alpine Feinkost" width={40} height={40} className="w-full h-full object-contain" />
                        </div>
                        <SheetTitle className={cn('ml-3', styles.logoText)}>
                          {t('app.title')}
                        </SheetTitle>
                      </div>
                    </SheetHeader>

                    {/* User Info */}
                    <div className={styles.drawerUserInfo}>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={styles.drawerUserDetails}>
                        <p className={styles.drawerUserName}>{user.displayName}</p>
                        <p className={styles.drawerUserEmail}>{user.email}</p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <nav className={styles.drawerNavContent}>
                      <NavLinks showLabels onItemClick={handleNavClick} />
                    </nav>

                    {/* Drawer Footer */}
                    <div className={styles.drawerFooter}>
                      {canSwitch && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start mb-2"
                          onClick={() => {
                            handleNavClick()
                            handleViewSwitch()
                          }}
                        >
                          <UserCircle className="mr-2 h-4 w-4" />
                          {t('viewSwitch.switchToWorker')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('nav.logout')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile Logo */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="h-8 w-8 rounded-md bg-white p-0.5 flex-shrink-0">
                  <Image src="/alpinefeinkostlabel.png" alt="Alpine Feinkost" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <span className={cn('text-lg font-semibold', styles.logoText)}>
                  {t('app.title')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* View Switcher - only for admin/superadmin */}
              {canSwitch && (
                <ViewSwitcher
                  currentView="admin"
                  onSwitch={handleViewSwitch}
                />
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* User Menu - Desktop only */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {canSwitch && (
                      <>
                        <DropdownMenuItem onClick={handleViewSwitch}>
                          <UserCircle className="mr-2 h-4 w-4" />
                          {t('viewSwitch.switchToWorker')}
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
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
