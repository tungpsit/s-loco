import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useSyncExternalStore } from 'react'
import type { VendorUser } from '../lib/api'
import { setToken } from '../lib/api'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: VendorUser | null
  isAuthenticated: boolean
  isHydrated: boolean
  vendorId: string | null

  login: (tokens: { token: string; refreshToken: string }, user: VendorUser) => void
  logout: () => Promise<void>
  setVendorId: (id: string | null) => void
  updateUser: (user: Partial<VendorUser>) => void
}

type AuthSnapshot = AuthState
type AuthSelector<T> = (state: AuthSnapshot) => T
type AuthStoreHook = {
  (): AuthSnapshot
  <T>(selector: AuthSelector<T>): T
  getState: () => AuthSnapshot
}

const STORAGE_KEY = 'vendor-auth'
const listeners = new Set<() => void>()

let state: AuthSnapshot = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  vendorId: null,
  login,
  logout,
  setVendorId,
  updateUser,
}

let hydrated = false
const serverSnapshot = state

export const useAuthStore = ((selector?: AuthSelector<unknown>) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [])

  return selector ? selector(snapshot) : snapshot
}) as AuthStoreHook

useAuthStore.getState = getSnapshot

function getSnapshot() {
  return state
}

function getServerSnapshot() {
  return serverSnapshot
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  for (const listener of listeners) listener()
}

function setState(partial: Partial<Omit<AuthSnapshot, keyof AuthStateMethods>>) {
  state = { ...state, ...partial }
  persist()
  emit()
}

type AuthStateMethods = {
  login: AuthState['login']
  logout: AuthState['logout']
  setVendorId: AuthState['setVendorId']
  updateUser: AuthState['updateUser']
}

function login(tokens: { token: string; refreshToken: string }, user: VendorUser) {
  setToken(tokens.token)
  setState({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user,
    isAuthenticated: true,
  })
}

async function logout() {
  await setToken(null)
  setState({
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    vendorId: null,
  })
}

function setVendorId(id: string | null) {
  setState({ vendorId: id })
}

function updateUser(partial: Partial<VendorUser>) {
  setState({ user: state.user ? { ...state.user, ...partial } : null })
}

async function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setState({ isHydrated: true })
      return
    }

    const parsed = JSON.parse(raw) as Partial<AuthSnapshot>
    if (parsed.token) await setToken(parsed.token)
    setState({
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
      isAuthenticated: Boolean(parsed.isAuthenticated && parsed.token),
      isHydrated: true,
      vendorId: parsed.vendorId ?? null,
    })
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY)
    setState({ isHydrated: true })
  }
}

async function persist() {
  const { token, refreshToken, user, isAuthenticated, vendorId } = state
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token, refreshToken, user, isAuthenticated, vendorId }),
  )
}
