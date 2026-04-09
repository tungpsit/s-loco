import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setToken } from '../lib/api'
import type { VendorUser } from '../lib/api'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: VendorUser | null
  isAuthenticated: boolean
  vendorId: string | null

  login: (tokens: { token: string; refreshToken: string }, user: VendorUser) => void
  logout: () => Promise<void>
  setVendorId: (id: string | null) => void
  updateUser: (user: Partial<VendorUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      vendorId: null,

      login: (tokens, user) => {
        setToken(tokens.token)
        set({
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          user,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        setToken(null)
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          vendorId: null,
        })
      },

      setVendorId: (id) => set({ vendorId: id }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'vendor-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        vendorId: state.vendorId,
      }),
    },
  ),
)
