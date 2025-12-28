import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ProductUnitType } from '@/lib/firestore/types'

// TTL: 7 days in milliseconds
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Storage version for future migrations
const STORAGE_VERSION = 1

interface PacklistFormLineItem {
  id: string
  productId: string
  productName: string
  unitType: ProductUnitType
  unitLabel: string
  basePrice: number
  plannedQuantity: number
  specialPrice: number | null
  note: string
}

interface PacklistFormDraft {
  version: number
  userId: string
  startedAt: number // timestamp
  lastUpdatedAt: number // timestamp
  selectedPosId: string
  selectedDate: string | null // ISO string or null
  assignedUserIds: string[]
  changeAmount: string
  note: string
  lineItems: PacklistFormLineItem[]
  saveAsTemplate: boolean
  templateName: string
  selectedTemplateId: string
}

interface PacklistFormDraftState {
  // Single draft per user (only one form at a time)
  draft: PacklistFormDraft | null

  // Actions
  saveDraft: (
    userId: string,
    formData: {
      selectedPosId: string
      selectedDate: Date | undefined
      assignedUserIds: string[]
      changeAmount: string
      note: string
      lineItems: PacklistFormLineItem[]
      saveAsTemplate: boolean
      templateName: string
      selectedTemplateId: string
    }
  ) => void
  getDraft: (userId: string) => PacklistFormDraft | null
  clearDraft: (userId: string) => void
}

// Generate storage key for the store
function getStoreKey(): string {
  const env = process.env.NODE_ENV || 'development'
  return `packlist-form-drafts::${env}`
}

export const usePacklistFormDraftStore = create<PacklistFormDraftState>()(
  persist(
    (set, get) => ({
      draft: null,

      saveDraft: (userId, formData) => {
        const now = Date.now()
        const existingDraft = get().draft

        // Check if draft exists and belongs to this user
        if (existingDraft && existingDraft.userId !== userId) {
          // Clear old draft if user changed
          set({ draft: null })
        }

        const draft: PacklistFormDraft = {
          version: STORAGE_VERSION,
          userId,
          startedAt: existingDraft?.startedAt || now,
          lastUpdatedAt: now,
          selectedPosId: formData.selectedPosId,
          selectedDate: formData.selectedDate ? formData.selectedDate.toISOString() : null,
          assignedUserIds: formData.assignedUserIds,
          changeAmount: formData.changeAmount,
          note: formData.note,
          lineItems: formData.lineItems,
          saveAsTemplate: formData.saveAsTemplate,
          templateName: formData.templateName,
          selectedTemplateId: formData.selectedTemplateId
        }

        set({ draft })
      },

      getDraft: (userId) => {
        const draft = get().draft

        if (!draft) {
          return null
        }

        // Check version mismatch
        if (draft.version !== STORAGE_VERSION) {
          get().clearDraft(userId)
          return null
        }

        // Check TTL expiry
        const now = Date.now()
        if (now - draft.lastUpdatedAt > DRAFT_TTL_MS) {
          get().clearDraft(userId)
          return null
        }

        // Verify userId matches (safety check)
        if (draft.userId !== userId) {
          return null
        }

        return draft
      },

      clearDraft: (userId) => {
        const draft = get().draft
        // Only clear if it belongs to this user
        if (draft && draft.userId === userId) {
          set({ draft: null })
        }
      }
    }),
    {
      name: getStoreKey(),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draft: state.draft }),
      // Cleanup expired drafts on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = Date.now()
          const draft = state.draft
          if (draft && now - draft.lastUpdatedAt > DRAFT_TTL_MS) {
            state.clearDraft(draft.userId)
          }
        }
      }
    }
  )
)

