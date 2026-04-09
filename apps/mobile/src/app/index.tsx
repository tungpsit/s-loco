/**
 * Root redirect — checks auth then redirects to login or home.
 */

import { router } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth-store'

export default function Index() {
  const { token, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (token) {
      router.replace('/(tabs)')
    } else {
      router.replace('/auth/login')
    }
  }, [isHydrated, token])

  return null
}
