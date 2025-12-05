import { create } from 'zustand'

export type PacklistStatus = 'open' | 'currently_selling' | 'sold' | 'completed'

interface PacklistLineItem {
  id: string
  productId: string
  productName: string
  unit: string
  plannedQuantity: number
  actualQuantity?: number
  remainingQuantity?: number
  specialPrice?: number
  note?: string
}

interface PacklistUiState {
  // Create/Edit form state
  selectedPosId: string | null
  selectedDate: Date | null
  assignedUserIds: string[]
  changeAmount: number
  note: string
  lineItems: PacklistLineItem[]
  saveAsTemplate: boolean
  templateName: string
  selectedTemplateId: string | null

  // Worker flow state
  currentStatus: PacklistStatus
  finalCashAmount: number

  // Actions
  setSelectedPosId: (id: string | null) => void
  setSelectedDate: (date: Date | null) => void
  setAssignedUserIds: (ids: string[]) => void
  setChangeAmount: (amount: number) => void
  setNote: (note: string) => void
  addLineItem: (item: Omit<PacklistLineItem, 'id'>) => void
  updateLineItem: (id: string, updates: Partial<PacklistLineItem>) => void
  removeLineItem: (id: string) => void
  setSaveAsTemplate: (save: boolean) => void
  setTemplateName: (name: string) => void
  setSelectedTemplateId: (id: string | null) => void
  setCurrentStatus: (status: PacklistStatus) => void
  setFinalCashAmount: (amount: number) => void
  resetForm: () => void
}

const initialState = {
  selectedPosId: null,
  selectedDate: null,
  assignedUserIds: [],
  changeAmount: 0,
  note: '',
  lineItems: [],
  saveAsTemplate: false,
  templateName: '',
  selectedTemplateId: null,
  currentStatus: 'open' as PacklistStatus,
  finalCashAmount: 0
}

export const usePacklistUiStore = create<PacklistUiState>((set) => ({
  ...initialState,

  setSelectedPosId: (id) => set({ selectedPosId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setAssignedUserIds: (ids) => set({ assignedUserIds: ids }),
  setChangeAmount: (amount) => set({ changeAmount: amount }),
  setNote: (note) => set({ note }),

  addLineItem: (item) =>
    set((state) => ({
      lineItems: [...state.lineItems, { ...item, id: crypto.randomUUID() }]
    })),

  updateLineItem: (id, updates) =>
    set((state) => ({
      lineItems: state.lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })),

  removeLineItem: (id) =>
    set((state) => ({
      lineItems: state.lineItems.filter((item) => item.id !== id)
    })),

  setSaveAsTemplate: (save) => set({ saveAsTemplate: save }),
  setTemplateName: (name) => set({ templateName: name }),
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  setCurrentStatus: (status) => set({ currentStatus: status }),
  setFinalCashAmount: (amount) => set({ finalCashAmount: amount }),

  resetForm: () => set(initialState)
}))

