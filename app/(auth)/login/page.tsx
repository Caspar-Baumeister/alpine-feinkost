'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Mountain, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { getUserByUid } from '@/lib/firestore/users'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function LoginPage() {
  const t = useTranslations('login')
  const tApp = useTranslations('app')
  const router = useRouter()
  const { user, isLoading: isCheckingAuth } = useCurrentUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (!isCheckingAuth && user) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/app')
      }
    }
  }, [user, isCheckingAuth, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)

      // Fetch user data to determine role
      const appUser = await getUserByUid(credential.user.uid)

      if (!appUser) {
        setError('User account not found. Please contact an administrator.')
        setIsLoading(false)
        return
      }

      if (!appUser.active) {
        setError('Your account has been deactivated. Please contact an administrator.')
        await auth.signOut()
        setIsLoading(false)
        return
      }

      // Redirect based on role
      if (appUser.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/app')
      }
    } catch (err: unknown) {
      console.error('Login error:', err)

      // Handle Firebase auth errors
      const errorCode = (err as { code?: string })?.code
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('An error occurred. Please try again.')
      }

      setIsLoading(false)
    }
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 items-center text-center pb-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Mountain className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                {tApp('title')}
              </h1>
              <p className="text-xs text-muted-foreground">{tApp('subtitle')}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('forgotPassword')}
                </button>
              </div>
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
