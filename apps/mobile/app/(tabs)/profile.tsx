import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth, getToken, setToken } from '../../lib/api'

const colors = {
  primary: '#005E97', primaryContainer: '#0077B6', primaryFixed: '#90E0EF',
  surface: '#F4F7FB', onSurface: '#161B2E', onSurfaceVariant: '#3B4460', error: '#BA1A1A',
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const token = await getToken()
    if (!token) return
    try {
      const res = await auth.me()
      if (res.ok) setUser(res.data?.data?.user)
    } catch { /* not logged in */ }
  }

  async function handleSendOtp() {
    if (!phone.match(/^0\d{9}$/)) return Alert.alert('Lỗi','Số điện thoại không hợp lệ')
    setLoading(true)
    const res = await auth.sendOtp(phone)
    setLoading(false)
    if (res.ok) { setOtpSent(true); Alert.alert('Thành công', 'Mã OTP đã được gửi') }
    else Alert.alert('Lỗi', res.data?.error?.message || 'Không gửi được OTP')
  }

  async function handleVerify() {
    if (code.length < 4) return
    setLoading(true)
    const res = await auth.verifyOtp(phone, code)
    setLoading(false)
    if (res.ok && res.data?.data?.access_token) {
      await setToken(res.data.data.access_token)
      setUser(res.data.data.user)
      setOtpSent(false); setCode('')
    } else Alert.alert('Lỗi', res.data?.error?.message || 'Mã OTP không đúng')
  }

  async function handleLogout() {
    await auth.logout()
    await setToken(null)
    setUser(null)
  }

  if (user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={{ fontSize: 32 }}>👤</Text></View>
          <Text style={styles.name}>{user.full_name || user.phone || 'Người dùng'}</Text>
          <Text style={styles.phone}>{user.phone || user.email}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Vai trò</Text><Text style={styles.infoValue}>{user.role || 'tourist'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Ngày tham gia</Text><Text style={styles.infoValue}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</Text></View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.loginContainer}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
      <Text style={styles.loginTitle}>Đăng nhập</Text>
      <Text style={styles.loginSub}>Nhập số điện thoại để nhận mã OTP</Text>

      <TextInput
        style={styles.input}
        placeholder="Số điện thoại (0901234567)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!otpSent}
      />

      {otpSent && (
        <TextInput
          style={[styles.input, { marginTop: 12, textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
          placeholder="Mã OTP"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
        onPress={otpSent ? handleVerify : handleSendOtp}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{otpSent ? 'Xác nhận OTP' : 'Gửi mã OTP'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loginContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  loginTitle: { fontSize: 24, fontWeight: '700', color: colors.onSurface, marginBottom: 6 },
  loginSub: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.onSurface },
  primaryBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 16, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  profileHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: colors.primaryContainer, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  phone: { fontSize: 14, color: colors.primaryFixed, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  infoLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  logoutBtn: { marginHorizontal: 16, marginTop: 32, backgroundColor: colors.error + '10', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: '600' },
})
