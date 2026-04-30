/**
 * Auth — OTP Verify: 4-digit OTP input → verify → redirect to home.
 */
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVerifyOtp } from '../../hooks/useQuery'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'
import { useAuthStore } from '../../stores/auth-store'

const OTP_LENGTH = 4

export default function OtpVerifyScreen() {
  const { phone, redirectTo } = useLocalSearchParams<{ phone: string; redirectTo?: string }>()

  const { login } = useAuthStore()

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputs = useRef<(TextInput | null)[]>([])

  const { mutate: verifyOtp, isPending } = useVerifyOtp()

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleChange(idx: number, text: string) {
    const digit = text.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[idx] = digit
    setCode(next)
    setError('')

    if (digit && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (digit && idx === OTP_LENGTH - 1) {
      const full = [...next].join('')
      if (full.length === OTP_LENGTH) {
        doVerify(full)
      }
    }
  }

  function handleKeyPress(idx: number, e: { nativeEvent: { key: string } }) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  function doVerify(fullCode: string) {
    verifyOtp(
      { phone: phone ?? '', code: fullCode },
      {
        onSuccess: async (data) => {
          await login(data.access_token, data.user)

          // Auto-claim pending gift if user came from a gift link
          if (globalThis.__pendingGiftToken) {
            const token = globalThis.__pendingGiftToken
            globalThis.__pendingGiftToken = undefined
            try {
              const { giftApi } = await import('../../lib/api')
              await giftApi.claim(token)
            } catch {
              // Non-critical — just redirect to vouchers
            }
          }

          router.replace(redirectTo?.startsWith('/') ? redirectTo : '/(tabs)')
        },
        onError: (err) => {
          setError(err.message ?? 'Mã OTP không đúng. Vui lòng thử lại.')
          setCode(Array(OTP_LENGTH).fill(''))
          inputs.current[0]?.focus()
        },
      },
    )
  }

  function handleResend() {
    if (countdown > 0) return
    // Resend via the sendOtp flow — navigate back to login
    router.replace({ pathname: '/(auth)/login' })
  }

  const isComplete = code.every((d) => d !== '')

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>OTP VERIFICATION</Text>
        <Text style={styles.title}>Nhập mã OTP</Text>
        <Text style={styles.subtitle}>
          Mã 4 chữ số đã được gửi đến <Text style={styles.phone}>{phone}</Text>
        </Text>
      </View>

      {/* OTP inputs */}
      <View style={styles.otpRow}>
        <TextInput
          key="otp-0"
          ref={(el) => {
            inputs.current[0] = el
          }}
          style={[styles.otpInput, error ? styles.otpError : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={code[0]}
          onChangeText={(t) => handleChange(0, t)}
          onKeyPress={(e) => handleKeyPress(0, e)}
          textAlign="center"
          selectTextOnFocus
          autoFocus
        />
        <TextInput
          key="otp-1"
          ref={(el) => {
            inputs.current[1] = el
          }}
          style={[styles.otpInput, error ? styles.otpError : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={code[1]}
          onChangeText={(t) => handleChange(1, t)}
          onKeyPress={(e) => handleKeyPress(1, e)}
          textAlign="center"
          selectTextOnFocus
        />
        <TextInput
          key="otp-2"
          ref={(el) => {
            inputs.current[2] = el
          }}
          style={[styles.otpInput, error ? styles.otpError : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={code[2]}
          onChangeText={(t) => handleChange(2, t)}
          onKeyPress={(e) => handleKeyPress(2, e)}
          textAlign="center"
          selectTextOnFocus
        />
        <TextInput
          key="otp-3"
          ref={(el) => {
            inputs.current[3] = el
          }}
          style={[styles.otpInput, error ? styles.otpError : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={code[3]}
          onChangeText={(t) => handleChange(3, t)}
          onKeyPress={(e) => handleKeyPress(3, e)}
          textAlign="center"
          selectTextOnFocus
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Manual submit button */}
      <TouchableOpacity
        style={[styles.button, (!isComplete || isPending) && styles.buttonDisabled]}
        onPress={() => doVerify(code.join(''))}
        disabled={!isComplete || isPending}
        activeOpacity={0.75}
      >
        <Text style={styles.buttonText}>{isPending ? 'Đang xác minh...' : 'Xác minh'}</Text>
      </TouchableOpacity>

      {/* Resend */}
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
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 56 : 72,
    paddingBottom: 72,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -32,
  },
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)', fontWeight: '800' },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.78)',
  },
  phone: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.white,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    padding: spacing.base,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    fontSize: 24,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    ...Platform.select({ web: { border: 'none' } }),
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
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    // boxShadow works cross-platform (CSS on web, ignored on native where shadow*+elevation apply)
    boxShadow: '0 8px 32px rgba(22, 27, 46, 0.12)',
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
    paddingHorizontal: spacing.lg,
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

declare global {
  // eslint-disable-next-line no-var
  var __pendingGiftToken: string | undefined
}
