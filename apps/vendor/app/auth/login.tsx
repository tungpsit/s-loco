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
import { router } from 'expo-router'
import { authApi, vendorApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerHighest: '#D6DDEA',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
  error: '#BA1A1A',
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email.')
      return
    }
    if (!password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login(email.trim(), password)
      if (res.ok && res.data?.data) {
        const { access_token, refresh_token, user } = res.data.data
        login({ token: access_token, refreshToken: refresh_token }, user)
        // Fetch vendor profile to get vendorId
        try {
          const vendorRes = await vendorApi.profile()
          if (vendorRes.ok && vendorRes.data?.data) {
            const v = vendorRes.data.data as { id: string }
            useAuthStore.getState().setVendorId(v.id)
          }
        } catch { /* ignore */ }
        router.replace('/(tabs)/')
      } else {
        const msg = res.data?.error?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.'
        Alert.alert('Lỗi đăng nhập', msg)
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={styles.logoEmoji}>🏪</Text>
          <Text style={styles.appName}>S-Loco Vendor</Text>
          <Text style={styles.tagline}>Quản lý cửa hàng của bạn</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng nhập</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="vendor@samson.vn"
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.outline}
            secureTextEntry
            textContentType="password"
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 S-Loco · Sầm Sơn</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerSection: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  logoEmoji: { fontSize: 64, marginBottom: 12 },
  appName: { fontSize: 26, fontWeight: '700', color: colors.primary },
  tagline: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 6 },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: colors.onSurface, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.onSurface,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.outline, fontSize: 12, marginTop: 32, marginBottom: 16 },
})
