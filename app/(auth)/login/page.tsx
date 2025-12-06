'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { getUserByUid } from '@/lib/firestore/users'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const t = useTranslations('login')
  const tApp = useTranslations('app')
  const router = useRouter()
  const { user, firebaseUser, isLoading: isCheckingAuth } = useCurrentUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!isCheckingAuth && user && !hasRedirected) {
      setHasRedirected(true)
      // Superadmin and admin go to admin dashboard, workers go to worker app
      const destination = user.role === 'superadmin' || user.role === 'admin' ? '/admin' : '/app'
      router.replace(destination)
    }
  }, [user, isCheckingAuth, router, hasRedirected])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Attempting login...')
      const credential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase auth successful, uid:', credential.user.uid)

      // Fetch user data to determine role
      const appUser = await getUserByUid(credential.user.uid)
      console.log('User data fetched:', appUser ? 'found' : 'not found')

      if (!appUser) {
        setError('User account not found in database. Please contact an administrator.')
        await auth.signOut()
        setIsLoading(false)
        return
      }

      if (!appUser.active) {
        setError('Your account has been deactivated. Please contact an administrator.')
        await auth.signOut()
        setIsLoading(false)
        return
      }

      // Mark as redirected to prevent double navigation
      setHasRedirected(true)

      // Redirect based on role - superadmin and admin go to admin dashboard
      const destination = appUser.role === 'superadmin' || appUser.role === 'admin' ? '/admin' : '/app'
      console.log('Redirecting to:', destination)
      router.replace(destination)

      // Keep loading state until navigation completes
    } catch (err: unknown) {
      console.error('Login error:', err)

      // Handle Firebase auth errors
      const errorCode = (err as { code?: string })?.code
      const errorMessage = (err as { message?: string })?.message

      console.error('Error code:', errorCode, 'Message:', errorMessage)

      if (errorCode === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (errorCode === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else if (errorCode === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (errorCode === 'auth/user-disabled') {
        setError('This account has been disabled.')
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.')
      } else {
        setError(`Login failed: ${errorMessage || 'Unknown error'}`)
      }

      setIsLoading(false)
    }
  }, [email, password, isLoading, router])

  // Show loading while checking auth state on mount
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If already logged in, show loading until redirect completes
  if (user || firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 items-center text-center pb-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-2xl bg-white p-2 shadow-lg">
              <Image
                src="/alpinefeinkostlabel.png"
                alt="Alpine Feinkost"
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                {tApp('title')}
              </h1>
              <p className="text-sm text-muted-foreground">{tApp('subtitle')}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submit')}...
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alpine Feinkost
      </p>
    </div>
  )
}
