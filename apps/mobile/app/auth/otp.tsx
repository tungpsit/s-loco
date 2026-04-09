import { router } from 'expo-router'
/**
 * Auth — Enter phone number → send OTP
 */
import { useState } from 'react'
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import { authApi } from '../../src/lib/api'

const vnPhoneRegex = /^(0|\+84)\d{9,10}$/

export default function OtpScreen() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    const clean = phone.trim()
    if (!vnPhoneRegex.test(clean)) {
      setError('Số điện thoại không hợp lệ (VD: 0912345678)')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.sendOtp(clean)
      router.replace({ pathname: '/auth/verify', params: { phone: clean } })
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể gửi mã OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌊</Text>
        <Text style={styles.heroTitle}>Chào mừng đến S-Loco</Text>
        <Text style={styles.heroSubtitle}>Nhập số điện thoại để nhận mã đăng nhập qua SMS</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="0912345678"
          placeholderTextColor={colors.outline}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => {
            setPhone(t)
            setError('')
          }}
          autoComplete="tel"
          maxLength={12}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Text style={styles.buttonText}>{loading ? 'Đang gửi...' : 'Nhận mã OTP'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Bằng cách tiếp tục, bạn đồng ý với <Text style={styles.link}>Điều khoản sử dụng</Text> của
        S-Loco.
      </Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 48 : 80,
    paddingBottom: spacing.xl,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.headlineMd,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    ...typography.labelLg,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    fontSize: 16,
    color: colors.onSurface,
    ...Platform.select({
      web: { outline: 'none' },
    }),
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(22, 27, 46, 0.06)',
      },
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    marginTop: 'auto',
  },
  link: {
    color: colors.primary,
  },
})
