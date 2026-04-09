/**
 * Auth — Login: phone number input → send OTP.
 */
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSendOtp } from '../../hooks/useQuery'
import { borderRadius, colors, shadows, spacing, typography } from '../../lib/theme'

const vnPhoneRegex = /^(0|\+84)\d{9,10}$/

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const { mutate: sendOtp, isPending } = useSendOtp()

  function handleSend() {
    const clean = phone.trim()
    if (!vnPhoneRegex.test(clean)) {
      setError('Số điện thoại không hợp lệ (VD: 0912345678)')
      return
    }
    setError('')
    sendOtp(clean, {
      onSuccess: () => {
        router.push({ pathname: '/(auth)/otp-verify', params: { phone: clean } })
      },
      onError: (err) => {
        Alert.alert('Lỗi', err.message ?? 'Không thể gửi mã OTP. Vui lòng thử lại.')
      },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🌊</Text>
            <Text style={styles.heroTitle}>Chào mừng đến S-Loco</Text>
            <Text style={styles.heroSubtitle}>Nhập số điện thoại để nhận mã đăng nhập qua SMS</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixFlag}>🇻🇳</Text>
                <Text style={styles.prefixCode}>+84</Text>
              </View>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="912 345 678"
                placeholderTextColor={colors.outline}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t)
                  setError('')
                }}
                maxLength={12}
                autoComplete="tel"
                autoFocus
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isPending && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={isPending}
              activeOpacity={0.75}
            >
              <Text style={styles.buttonText}>{isPending ? 'Đang gửi...' : 'Gửi mã OTP'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.footerLink}>Điều khoản sử dụng</Text> của S-Loco.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.headlineMd,
    textAlign: 'center',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  label: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
  },
  prefixFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  prefixCode: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.onSurface,
    ...Platform.select({ web: { border: 'none' } }),
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    // boxShadow works cross-platform (CSS on web, ignored on native where shadow*+elevation apply)
    boxShadow: '0 8px 32px rgba(22, 27, 46, 0.12)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    ...typography.bodySm,
    textAlign: 'center',
    color: colors.outline,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  footerLink: {
    color: colors.primary,
  },
})
