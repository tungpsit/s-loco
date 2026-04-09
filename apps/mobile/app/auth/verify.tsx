import { router, useLocalSearchParams } from 'expo-router'
/**
 * Auth — Verify 4-digit OTP
 */
import { useEffect, useRef, useState } from 'react'
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import { authApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const { login } = useAuthStore()

  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  function handleChange(idx: number, text: string) {
    const digits = text.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[idx] = digits
    setCode(next)
    setError('')
    if (digits && idx < 3) {
      inputs.current[idx + 1]?.focus()
    }
  }

  function handleKeyPress(idx: number, e: any) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const codeStr = code.join('')

  async function handleVerify() {
    if (codeStr.length < 4) {
      setError('Vui lòng nhập đủ 4 chữ số')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(phone ?? '', codeStr)
      await login(res.access_token, res.user)
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message ?? 'Mã OTP không đúng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setLoading(true)
    setCode(['', '', '', ''])
    setError('')
    try {
      await authApi.sendOtp(phone ?? '')
      setCountdown(60)
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể gửi lại mã OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nhập mã OTP</Text>
        <Text style={styles.subtitle}>
          Mã 4 chữ số đã được gửi đến <Text style={styles.phone}>{phone}</Text>
        </Text>
      </View>

      {/* OTP inputs */}
      <View style={styles.otpRow}>
        {code.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(el) => {
              inputs.current[idx] = el
            }}
            style={[styles.otpInput, error ? styles.otpError : null]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(t) => handleChange(idx, t)}
            onKeyPress={(e) => handleKeyPress(idx, e)}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (loading || codeStr.length < 4) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading || codeStr.length < 4}
        activeOpacity={0.75}
      >
        <Text style={styles.buttonText}>{loading ? 'Đang xác minh...' : 'Xác minh'}</Text>
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Không nhận được mã? </Text>
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
          <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.headlineMd,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  phone: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.onSurface,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    fontSize: 24,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    ...Platform.select({ web: { outline: 'none' } }),
  },
  otpError: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(22, 27, 46, 0.12)' },
      default: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  resendText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  resendLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: colors.outline,
  },
})
