import AsyncStorage from '@react-native-async-storage/async-storage'
/**
 * S-Loco — Auth Store (Zustand + AsyncStorage persist)
 */
import { create } from 'zustand'
import { setToken } from '../lib/api'
import type { UserProfile } from '../lib/api'

interface AuthState {
  token: string | null
  user: UserProfile | null
  isLoading: boolean
  isHydrated: boolean

  login: (token: string, user: UserProfile) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserProfile) => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem('auth_state')
      if (raw) {
        const { token, user } = JSON.parse(raw) as { token: string; user: UserProfile }
        await setToken(token)
        set({ token, user, isHydrated: true })
      } else {
        set({ isHydrated: true })
      }
    } catch {
      set({ isHydrated: true })
    }
  },

  login: async (token, user) => {
    await setToken(token)
    await AsyncStorage.setItem('auth_state', JSON.stringify({ token, user }))
    set({ token, user })
  },

  logout: async () => {
    await setToken(null)
    await AsyncStorage.removeItem('auth_state')
    set({ token: null, user: null })
  },

  setUser: (user) => {
    const { token } = get()
    set({ user })
    if (token) {
      AsyncStorage.setItem('auth_state', JSON.stringify({ token, user })).catch(() => {})
    }
  },
}))
