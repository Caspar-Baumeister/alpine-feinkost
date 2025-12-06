import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'admin' | 'worker'

interface ViewModeState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set, get) => ({
      viewMode: 'admin',
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () =>
        set({ viewMode: get().viewMode === 'admin' ? 'worker' : 'admin' })
    }),
    {
      name: 'view-mode-storage'
    }
  )
)

