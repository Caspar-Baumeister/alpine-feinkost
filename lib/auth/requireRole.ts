import { redirect } from 'next/navigation'
import { getCurrentUser } from './getCurrentUser'
import { AppUser, UserRole } from './types'

/**
 * Require a specific role to access a page
 * Redirects to login if not authenticated
 * Redirects to appropriate dashboard if wrong role
 * 
 * TODO: Implement real role checking with Firebase
 * - Verify token/session
 * - Check role in Firestore user document
 */
export async function requireRole(requiredRole: UserRole): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    // TODO: Implement proper redirect to login with return URL
    redirect('/login')
  }

  if (user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (user.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/app')
    }
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AppUser> {
  return requireRole('admin')
}

/**
 * Require worker role
 */
export async function requireWorker(): Promise<AppUser> {
  return requireRole('worker')
}

/**
 * Require any authenticated user (admin or worker)
 */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

