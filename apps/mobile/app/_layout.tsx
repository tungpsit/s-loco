import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
/**
 * S-Loco — Root Layout with auth gate
 */
import type React from 'react'
import { useEffect } from 'react'
import { colors } from '../lib/theme'
import { registerPushNotifications } from '../src/lib/push-notifications'
import { useAuthStore } from '../src/stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})

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
          <Stack.Screen name="auth" options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="vendor/[id]" options={{ headerShown: true, title: 'Cửa hàng' }} />
          <Stack.Screen name="service/[id]" options={{ headerShown: true, title: 'Dịch vụ' }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Đơn hàng' }} />
          <Stack.Screen
            name="order/checkout"
            options={{ headerShown: true, title: 'Thanh toán' }}
          />
          <Stack.Screen name="voucher/[id]" options={{ headerShown: true, title: 'Voucher' }} />
          <Stack.Screen
            name="voucher/[id]/scan"
            options={{ headerShown: true, title: 'Quét QR' }}
          />
          <Stack.Screen
            name="content/articles"
            options={{ headerShown: true, title: 'Bài viết' }}
          />
          <Stack.Screen name="content/[slug]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen
            name="content/weather"
            options={{ headerShown: true, title: 'Thời tiết' }}
          />
          <Stack.Screen
            name="ai/itinerary"
            options={{ headerShown: true, title: 'Lịch trình AI' }}
          />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  )
}
