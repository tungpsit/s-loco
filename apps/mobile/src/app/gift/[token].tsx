/**
 * Gift Claim — handles sloco://gift/{token} deep links.
 * Shows loading state, then success/error, then redirects to vouchers.
 */
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { giftApi } from '../../lib/api'
import { useAuthStore } from '../../stores/auth-store'
import { colors, spacing, typography } from '../../lib/theme'

export default function GiftClaimScreen() {
  const { isLoggedIn } = useAuthStore()
  const [phase, setPhase] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState<string | null>(null)

  // Read token from deep link URL via expo-router
  // Token is the [token] dynamic segment in the route filename
  useEffect(() => {
    const url = window.location?.href ?? ''
    const match = url.match(/gift\/([^/?#]+)/)
    if (match) {
      setToken(decodeURIComponent(match[1]!))
    } else {
      setErrorMsg('Link không hợp lệ.')
      setPhase('error')
    }
  }, [])

  // Run claim once token is available
  useEffect(() => {
    if (!token) return

    const runClaim = async () => {
      if (!isLoggedIn) {
        global.__pendingGiftToken = token
        router.replace('/(auth)/login')
        return
      }

      try {
        await giftApi.claim(token)
        setPhase('success')
        setTimeout(() => router.replace('/(tabs)/vouchers'), 2000)
      } catch (err: any) {
        setErrorMsg(err.message ?? 'Không thể nhận voucher.')
        setPhase('error')
      }
    }

    runClaim()
  }, [token, isLoggedIn])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {phase === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.message}>Đang nhận voucher...</Text>
          </>
        )}
        {phase === 'success' && (
          <>
            <Text style={styles.emoji}>🎁</Text>
            <Text style={styles.successTitle}>Nhận voucher thành công!</Text>
            <Text style={styles.message}>Đang chuyển đến danh sách voucher...</Text>
          </>
        )}
        {phase === 'error' && (
          <>
            <Text style={styles.emoji}>😕</Text>
            <Text style={styles.errorTitle}>Không thể nhận voucher</Text>
            <Text style={styles.message}>{errorMsg}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

declare global {
  // eslint-disable-next-line no-var
  var __pendingGiftToken: string | undefined
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emoji: { fontSize: 64 },
  message: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  successTitle: {
    ...typography.titleMd,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.titleMd,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.error,
  },
})
