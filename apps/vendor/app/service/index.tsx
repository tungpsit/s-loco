import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { serviceApi, vendorApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'
import { ErrorState } from '../../src/components/error-state'
import type { Service } from '../../src/lib/api'

const colors = {
  primary: '#005E97',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  error: '#BA1A1A',
}

const fmt = (s?: string) => {
  if (!s) return '—'
  return Number(s).toLocaleString('vi-VN') + '₫'
}

export default function ServiceListScreen() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const vendorId = useAuthStore((s) => s.vendorId)

  const load = useCallback(async () => {
    setError(false)
    try {
      let vId = vendorId ?? useAuthStore.getState().vendorId
      if (!vId) {
        const vRes = await vendorApi.profile()
        if (vRes.ok && vRes.data?.data) {
          const v = vRes.data.data as any
          vId = v.id
          useAuthStore.getState().setVendorId(v.id)
        }
      }
      if (vId) {
        const res = await serviceApi.listByVendor(vId)
        if (res.ok && res.data?.data?.services) {
          setServices(res.data.data.services as Service[])
        }
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [vendorId])

  useEffect(() => { load() }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const handleDelete = useCallback((service: Service) => {
    Alert.alert(
      'Xóa dịch vụ',
      `Bạn có chắc muốn xóa "${service.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceApi.delete(service.id)
              setServices((prev) => prev.filter((s) => s.id !== service.id))
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa dịch vụ.')
            }
          },
        },
      ],
    )
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: Service }) => (
      <View style={styles.serviceCard}>
        <TouchableOpacity
          style={styles.serviceInfo}
          onPress={() => router.push(`/service/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.serviceIcon}>
            <Text style={{ fontSize: 24 }}>🎟️</Text>
          </View>
          <View style={styles.serviceText}>
            <Text style={styles.serviceName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.serviceDesc} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{fmt(item.original_price)}</Text>
              {item.discount_price && (
                <Text style={styles.discountPrice}>
                  {fmt(item.discount_price)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/service/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDelete],
  )

  return (
    <>
      <Stack.Screen
        options={{ title: 'Dịch vụ của tôi' }}
      />
      <View style={styles.container}>
        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/service/new')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+ Thêm dịch vụ</Text>
        </TouchableOpacity>

        {loading && services.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, paddingVertical: 60 }} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : services.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎟️</Text>
            <Text style={styles.emptyTitle}>Chưa có dịch vụ nào</Text>
            <Text style={styles.emptySub}>Thêm dịch vụ để bắt đầu nhận đơn hàng</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/service/new')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Thêm dịch vụ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  serviceCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceInfo: { flexDirection: 'row', padding: 16 },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceText: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '600', color: colors.onSurface, marginBottom: 2 },
  serviceDesc: { fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
  discountPrice: { fontSize: 12, color: colors.onSurfaceVariant, textDecorationLine: 'line-through' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F4F7FB' },
  actionBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  actionBtnDanger: { borderLeftWidth: 1, borderLeftColor: '#F4F7FB' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  emptyCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
})
