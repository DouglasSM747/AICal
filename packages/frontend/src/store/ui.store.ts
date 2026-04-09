import { create } from 'zustand'

interface UIState {
  entryModalOpen: boolean
  openEntryModal: () => void
  closeEntryModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  entryModalOpen: false,
  openEntryModal: () => set({ entryModalOpen: true }),
  closeEntryModal: () => set({ entryModalOpen: false }),
}))
