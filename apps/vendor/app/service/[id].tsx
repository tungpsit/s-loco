import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { ErrorState } from '../../src/components/error-state'
import { ServiceForm } from '../../src/components/service-form'
import type { CreateServiceInput, Service, UpdateServiceInput } from '../../src/lib/api'
import { serviceApi, vendorApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'

const colors = {
  surface: '#F4F7FB',
}

export default function ServiceFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const [initialData, setInitialData] = useState<Partial<CreateServiceInput> | undefined>()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        // Try to get vendor ID first
        let vendorId = useAuthStore.getState().vendorId
        if (!vendorId) {
          const vRes = await vendorApi.profile()
          if (vRes.ok && vRes.data?.data) {
            const v = vRes.data.data
            vendorId = v.id
            useAuthStore.getState().setVendorId(v.id)
          }
        }
        if (vendorId) {
          const res = await serviceApi.listByVendor(vendorId)
          if (res.ok && res.data?.data?.services) {
            const svc = (res.data.data.services as Service[]).find((s) => s.id === id)
            if (svc) {
              setInitialData({
                name: svc.name,
                description: svc.description,
                original_price: svc.original_price,
                discount_price: svc.discount_price,
              })
            }
          }
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isNew])

  const handleSubmit = useCallback(
    async (data: CreateServiceInput | UpdateServiceInput) => {
      setSaving(true)
      try {
        let vendorId = useAuthStore.getState().vendorId
        if (!vendorId) {
          const vRes = await vendorApi.profile()
          if (!vRes.ok || !vRes.data?.data) {
            Alert.alert('Lỗi', 'Không tìm được thông tin cửa hàng.')
            return
          }
          const v = vRes.data.data
          vendorId = v.id
          useAuthStore.getState().setVendorId(v.id)
        }

        if (!vendorId) {
          Alert.alert('Lỗi', 'Không tìm được thông tin cửa hàng.')
          return
        }

        if (isNew) {
          const res = await serviceApi.create(vendorId, data as CreateServiceInput)
          if (res.ok) {
            Alert.alert('Thành công', 'Dịch vụ đã được thêm!', [
              { text: 'OK', onPress: () => router.back() },
            ])
          } else {
            const msg = res.data?.error?.message ?? 'Không thể tạo dịch vụ.'
            Alert.alert('Lỗi', msg)
          }
        } else {
          const res = await serviceApi.update(id!, data as UpdateServiceInput)
          if (res.ok) {
            Alert.alert('Thành công', 'Dịch vụ đã được cập nhật!', [
              { text: 'OK', onPress: () => router.back() },
            ])
          } else {
            const msg = res.data?.error?.message ?? 'Không thể cập nhật dịch vụ.'
            Alert.alert('Lỗi', msg)
          }
        }
      } catch {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.')
      } finally {
        setSaving(false)
      }
    },
    [id, isNew],
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? 'Thêm dịch vụ' : 'Sửa dịch vụ',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: '#161B2E',
        }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#005E97" />
        </View>
      ) : error ? (
        <ErrorState onRetry={() => router.back()} />
      ) : (
        <ServiceForm initial={initialData} onSubmit={handleSubmit} loading={saving} />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FB' },
})
