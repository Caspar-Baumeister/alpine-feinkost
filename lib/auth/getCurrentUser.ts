import { AppUser } from './types'

/**
 * Get the current authenticated user
 * TODO: Implement real Firebase auth logic
 * - Use Firebase Admin SDK on server
 * - Verify session cookie or token
 * - Fetch user document from Firestore for role/locale
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  // TODO: Replace with real Firebase authentication
  // For now, return a mock admin user for development
  const mockUser: AppUser = {
    uid: 'mock-admin-uid-123',
    email: 'admin@alpine-feinkost.de',
    displayName: 'Max Mustermann',
    role: 'admin',
    locale: 'de'
  }

  return mockUser
}

/**
 * Get mock worker user for testing worker views
 */
export async function getMockWorkerUser(): Promise<AppUser> {
  return {
    uid: 'mock-worker-uid-456',
    email: 'worker@alpine-feinkost.de',
    displayName: 'Anna Arbeiter',
    role: 'worker',
    locale: 'de'
  }
}

