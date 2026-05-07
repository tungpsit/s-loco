'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setAuthToken } from './api'

interface User {
  id: string
  email: string
  fullName: string
  role: string
  phone?: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

type ApiResponse<T> = {
  data?: T
}

type AuthTokens = {
  access_token: string
  refresh_token: string
}

type LoginData = {
  tokens: AuthTokens
  user?: User
}

type RefreshData = {
  access_token: string
  refresh_token: string
}

type ProfileData = {
  user?: User
}

const AuthContext = createContext<AuthState | null>(null)

const TOKEN_KEY = 'sloco_admin_token'
const REFRESH_KEY = 'sloco_admin_refresh'
const USER_KEY = 'sloco_admin_user'

// Refresh ~2 minutes before access token expires (15 min TTL)
const REFRESH_INTERVAL_MS = 13 * 60 * 1000 // 13 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setAuthToken(null)
    setUser(null)
  }, [])

  const refreshSession = useCallback(async (refreshToken: string) => {
    const res = (await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      noAuth: true,
    })) as ApiResponse<RefreshData>
    const { access_token, refresh_token } = res.data!
    setAuthToken(access_token)
    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(REFRESH_KEY, refresh_token)

    // Fetch user profile with new token
    const profileRes = (await api('/auth/me')) as ApiResponse<ProfileData>
    const u = profileRes.data?.user
    if (u) {
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    }
  }, [])

  // ─── Restore session on mount ───────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      setAuthToken(savedToken)
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        clearSession()
      }

      // Verify token is still valid by fetching profile
      api('/auth/me')
        .then((res) => {
          const profile = res as ApiResponse<ProfileData>
          const u = profile.data?.user
          if (u) {
            setUser(u)
            localStorage.setItem(USER_KEY, JSON.stringify(u))
          }
        })
        .catch(async () => {
          // Try refresh
          const refreshToken = localStorage.getItem(REFRESH_KEY)
          if (refreshToken) {
            try {
              await refreshSession(refreshToken)
            } catch {
              clearSession()
            }
          } else {
            clearSession()
          }
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Periodic refresh to keep session alive ────────────
  useEffect(() => {
    if (!user) return

    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const doRefresh = async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY)
      if (!refreshToken) {
        clearSession()
        return
      }
      try {
        await refreshSession(refreshToken)
      } catch {
        // If refresh fails, clear everything
        clearSession()
      }
    }

    // Helper to schedule the next refresh
    const scheduleNext = () => {
      // Clear any existing timers
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)

      // On visibility change or focus, do a quick refresh if due
      intervalId = setInterval(doRefresh, REFRESH_INTERVAL_MS)
    }

    scheduleNext()

    // Also refresh when the tab becomes visible again (user returns from idle)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce: clear any scheduled refresh and do it now,
        // then reset the interval
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          doRefresh()
          scheduleNext()
        }, 1000)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user, refreshSession, clearSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = (await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        noAuth: true,
      })) as ApiResponse<LoginData>

      const { tokens, user: loginUser } = res.data!
      const { access_token, refresh_token } = tokens
      setAuthToken(access_token)
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(REFRESH_KEY, refresh_token)

      // If login response includes user, use it; otherwise fetch profile
      if (loginUser) {
        setUser(loginUser)
        localStorage.setItem(USER_KEY, JSON.stringify(loginUser))
      } else {
        const profileRes = (await api('/auth/me')) as ApiResponse<ProfileData>
        const u = profileRes.data?.user
        if (u) {
          setUser(u)
          localStorage.setItem(USER_KEY, JSON.stringify(u))
        }
      }

      router.push('/dashboard')
    },
    [router],
  )

  const logout = useCallback(() => {
    // Best-effort server logout
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
    router.push('/login')
  }, [router, clearSession])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

