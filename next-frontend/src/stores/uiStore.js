import { create } from "zustand"

/**
 * Shared client-only UI state. Do not store API entities here — use TanStack Query.
 * Used for chrome that spans multiple client islands (e.g. mobile nav sheet).
 */
export const useUiStore = create((set) => ({
  mobileMoreOpen: false,
  setMobileMoreOpen: (open) => set({ mobileMoreOpen: Boolean(open) }),
}))
