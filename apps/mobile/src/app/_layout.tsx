/**
 * S-Loco — Root Layout
 * Expo Router entry point with TanStack Query + auth gate.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import type React from 'react'
import { useEffect } from 'react'
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
  const { isHydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

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
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
          <Stack.Screen name="ai" options={{ animation: 'fade' }} />
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
            name="gift/[token]"
            options={{ headerShown: true, title: 'Nhận voucher', animation: 'fade' }}
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
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  )
}
