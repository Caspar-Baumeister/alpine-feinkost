import { redirect } from 'next/navigation'
import { getCurrentUser } from './getCurrentUser'
import { AppUser, UserRole, canAccessAdminRoutes, canAccessWorkerRoutes } from './types'

/**
 * Require a specific role to access a page
 * Redirects to login if not authenticated
 * Redirects to appropriate dashboard if wrong role
 */
export async function requireRole(requiredRole: UserRole): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (canAccessAdminRoutes(user.role)) {
      redirect('/admin')
    } else {
      redirect('/app')
    }
  }

  return user
}

/**
 * Require superadmin role
 */
export async function requireSuperadmin(): Promise<AppUser> {
  return requireRole('superadmin')
}

/**
 * Require admin role (also allows superadmin)
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!canAccessAdminRoutes(user.role)) {
    redirect('/app')
  }

  return user
}

/**
 * Require worker role (allows any role)
 */
export async function requireWorker(): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!canAccessWorkerRoutes(user.role)) {
    redirect('/login')
  }

  return user
}

/**
 * Require any authenticated user
 */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
