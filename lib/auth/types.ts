export type UserRole = 'superadmin' | 'admin' | 'worker'
export type Locale = 'de' | 'en'

export interface AppUser {
    uid: string
    email: string
    displayName: string
    role: UserRole
    locale: Locale
    active: boolean
}

// Helper functions for role checks
export function canAccessAdminRoutes(role: UserRole): boolean {
    return role === 'superadmin' || role === 'admin'
}

export function canAccessWorkerRoutes(role: UserRole): boolean {
    return role === 'superadmin' || role === 'admin' || role === 'worker'
}

export function canAccessStatistics(role: UserRole): boolean {
    return role === 'superadmin'
}

export function canAccessUserManagement(role: UserRole): boolean {
    return role === 'superadmin'
}

export function canSwitchToWorkerView(role: UserRole): boolean {
    return role === 'superadmin' || role === 'admin'
}
