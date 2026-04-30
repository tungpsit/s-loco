import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/stores/auth-store'

export default function Index() {
  const { isHydrated } = useAuthStore()

  if (!isHydrated) return null

  return <Redirect href="/(tabs)" />
}
