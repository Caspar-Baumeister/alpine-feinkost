export type UserRole = 'admin' | 'worker'
export type Locale = 'de' | 'en'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  locale: Locale
}

