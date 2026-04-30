/**
 * Root redirect — hydrate auth then open the guest-first home flow.
 */

import { router } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth-store'

export default function Index() {
  const { isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    router.replace('/(tabs)')
  }, [isHydrated])

  return null
}
