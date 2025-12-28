import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// TTL: 7 days in milliseconds
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Storage version for future migrations
const STORAGE_VERSION = 1

interface PacklistItemProgress {
  productId: string
  startQuantity: number
  endQuantity: number
}

interface PacklistDraft {
  version: number
  packlistId: string
  userId: string
  startedAt: number // timestamp
  lastUpdatedAt: number // timestamp
  items: PacklistItemProgress[]
  finalCash: string
  workerNote: string
}

interface PacklistDraftState {
  // Key format: `${userId}::${packlistId}`
  drafts: Record<string, PacklistDraft>

  // Actions
  saveDraft: (
    packlistId: string,
    userId: string,
    items: PacklistItemProgress[],
    finalCash: string,
    workerNote: string
  ) => void
  getDraft: (packlistId: string, userId: string) => PacklistDraft | null
  clearDraft: (packlistId: string, userId: string) => void
  clearAllDrafts: () => void
  cleanupExpiredDrafts: () => void
}

// Generate storage key for a specific draft
function getDraftKey(packlistId: string, userId: string): string {
  return `${userId}::${packlistId}`
}

// Generate storage key for the store
function getStoreKey(): string {
  const env = process.env.NODE_ENV || 'development'
  return `packlist-drafts::${env}`
}

export const usePacklistDraftStore = create<PacklistDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (packlistId, userId, items, finalCash, workerNote) => {
        const now = Date.now()
        const draftKey = getDraftKey(packlistId, userId)
        const existingDraft = get().drafts[draftKey]

        set((state) => {
          const draft: PacklistDraft = {
            version: STORAGE_VERSION,
            packlistId,
            userId,
            startedAt: existingDraft?.startedAt || now,
            lastUpdatedAt: now,
            items,
            finalCash,
            workerNote
          }

          return {
            drafts: {
              ...state.drafts,
              [draftKey]: draft
            }
          }
        })
      },

      getDraft: (packlistId, userId) => {
        const draftKey = getDraftKey(packlistId, userId)
        const draft = get().drafts[draftKey]

        if (!draft) {
          return null
        }

        // Check version mismatch
        if (draft.version !== STORAGE_VERSION) {
          get().clearDraft(packlistId, userId)
          return null
        }

        // Check TTL expiry
        const now = Date.now()
        if (now - draft.lastUpdatedAt > DRAFT_TTL_MS) {
          get().clearDraft(packlistId, userId)
          return null
        }

        // Verify userId matches (safety check)
        if (draft.userId !== userId) {
          return null
        }

        return draft
      },

      clearDraft: (packlistId, userId) => {
        const draftKey = getDraftKey(packlistId, userId)
        set((state) => {
          const { [draftKey]: removed, ...rest } = state.drafts
          return { drafts: rest }
        })
      },

      clearAllDrafts: () => {
        set({ drafts: {} })
      },

      cleanupExpiredDrafts: () => {
        const now = Date.now()
        set((state) => {
          const cleaned: Record<string, PacklistDraft> = {}

          for (const [key, draft] of Object.entries(state.drafts)) {
            // Keep if not expired and version matches
            if (
              draft.version === STORAGE_VERSION &&
              now - draft.lastUpdatedAt <= DRAFT_TTL_MS
            ) {
              cleaned[key] = draft
            }
          }

          return { drafts: cleaned }
        })
      }
    }),
    {
      name: getStoreKey(),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ drafts: state.drafts }),
      // Cleanup expired drafts on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.cleanupExpiredDrafts()
        }
      }
    }
  )
)

