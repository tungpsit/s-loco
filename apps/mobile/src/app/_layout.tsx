/**
 * S-Loco — Root Layout
 * Expo Router entry point with TanStack Query + auth gate.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import type React from 'react'
import { useEffect } from 'react'
import { registerPushNotifications } from '../lib/push-notifications'
import { colors } from '../lib/theme'
import { useAuthStore } from '../stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})

// ─── Auth Gate -----------------------------------------------------------
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isHydrated, hydrate, isLoggedIn } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return
    registerPushNotifications().catch((err) => {
      console.warn('[Push] Failed to register device token:', err)
    })
  }, [isHydrated, isLoggedIn])

  if (!isHydrated) return null

  return <>{children}</>
}

// ─── Root Layout --------------------------------------------------------
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerStyle: { backgroundColor: colors.white },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.onSurface, fontWeight: '700' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none', headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="service/[id]" options={{ headerShown: true, title: 'Dịch vụ' }} />
          <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Thanh toán' }} />
          <Stack.Screen name="voucher/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="gift/[token]"
            options={{ headerShown: true, title: 'Nhận voucher', animation: 'fade' }}
          />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  )
}
