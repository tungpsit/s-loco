import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/stores/auth-store'

export default function Index() {
  const { token, isHydrated } = useAuthStore()

  if (!isHydrated) return null

  if (!token) {
    return <Redirect href="/auth/otp" />
  }

  return <Redirect href="/(tabs)" />
}
