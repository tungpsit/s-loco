import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { Stack } from 'expo-router'
import { vendorApi } from '../src/lib/api'
import { useAuthStore } from '../src/stores/auth-store'
import { ErrorState } from '../src/components/error-state'
import type { VendorProfile } from '../src/lib/api'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerHighest: '#D6DDEA',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const setVendorId = useAuthStore((s) => s.setVendorId)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await vendorApi.profile()
      if (res.ok && res.data?.data) {
        const v = res.data.data as VendorProfile
        setVendor(v)
        setVendorId(v.id)
        setName(v.name ?? '')
        setDescription(v.description ?? '')
        setAddress(v.address ?? '')
        setPhone(v.phone ?? '')
        setEmail(v.email ?? '')
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [setVendorId])

  useEffect(() => { load() }, [load])

  const handleSave = useCallback(async () => {
    if (!vendor) return
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên cửa hàng.')
      return
    }

    setSaving(true)
    try {
      const res = await vendorApi.update(vendor.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      if (res.ok) {
        Alert.alert('Thành công', 'Thông tin cửa hàng đã được lưu!')
      } else {
        const msg = res.data?.error?.message ?? 'Không thể lưu thông tin.'
        Alert.alert('Lỗi', msg)
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.')
    } finally {
      setSaving(false)
    }
  }, [vendor, name, description, address, phone, email])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Thông tin cửa hàng',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
        }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Vendor */}
            <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>

            <Text style={styles.label}>Tên cửa hàng *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: Quán ăn biển Sầm Sơn"
              placeholderTextColor="#6B7694"
              maxLength={200}
            />

            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Đường, phường, thành phố..."
              placeholderTextColor="#6B7694"
              maxLength={500}
            />

            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Giới thiệu về cửa hàng của bạn..."
              placeholderTextColor="#6B7694"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={2000}
            />

            <Text style={styles.sectionTitle}>Liên hệ</Text>

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0912 345 678"
              placeholderTextColor="#6B7694"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="cua-hang@example.com"
              placeholderTextColor="#6B7694"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface, marginTop: 20, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: colors.surfaceContainerHighest, borderRadius: 12, padding: 14, fontSize: 15, color: colors.onSurface },
  textArea: { height: 100, paddingTop: 14 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
})
