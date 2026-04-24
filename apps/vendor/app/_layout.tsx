import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '../src/stores/auth-store'

export default function RootLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isHydrated, router])

  return <Stack screenOptions={{ headerShown: false }} />
}
