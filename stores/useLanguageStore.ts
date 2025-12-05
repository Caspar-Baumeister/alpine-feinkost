import { create } from 'zustand'

type Locale = 'de' | 'en'

interface LanguageState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'de',
  setLocale: (locale) => set({ locale })
}))

