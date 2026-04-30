import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { registerPushNotifications } from '../src/lib/push-notifications'
import { useAuthStore } from '../src/stores/auth-store'

export default function RootLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isHydrated, router])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return
    registerPushNotifications().catch((err) => {
      console.warn('[Push] Failed to register device token:', err)
    })
  }, [isAuthenticated, isHydrated])

  return <Stack screenOptions={{ headerShown: false }} />
}
