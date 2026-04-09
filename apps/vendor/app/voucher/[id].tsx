import { useEffect, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { voucherApi } from '../../src/lib/api'
import { ErrorState } from '../../src/components/error-state'
import type { Voucher } from '../../src/lib/api'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerLow: '#EDF1F8',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  paid: { label: 'Chờ đổi', bg: '#FFF3E0', color: '#E65100' },
  redeemed: { label: 'Đã đổi', bg: '#E8F5E9', color: '#2E7D32' },
  completed: { label: 'Hoàn thành', bg: '#E8F5E9', color: '#2E7D32' },
  settled: { label: 'Đã thanh toán', bg: '#F3E5F5', color: '#7B1FA2' },
  expired: { label: 'Hết hạn', bg: '#ECEFF1', color: '#546E7A' },
  cancelled: { label: 'Đã hủy', bg: '#FFEBEE', color: '#C62828' },
}

const fmt = (n?: number) =>
  n != null ? Number(n).toLocaleString('vi-VN') + '₫' : '—'

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await voucherApi.list({ limit: 100 })
      if (res.ok && res.data?.data) {
        const items: Voucher[] = res.data.data?.items ?? res.data.data?.data ?? []
        const found = items.find((v) => v.id === id)
        setVoucher(found ?? null)
        if (!found) setError(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleComplete = useCallback(async () => {
    if (!voucher) return
    Alert.alert('Xác nhận hoàn thành', 'Bạn có chắc đã cung cấp dịch vụ này cho khách?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setCompleting(true)
          try {
            const res = await voucherApi.complete(voucher.id)
            if (res.ok && res.data?.data?.voucher) {
              setVoucher(res.data.data.voucher as Voucher)
              Alert.alert('Thành công', 'Đã xác nhận hoàn thành dịch vụ!')
            } else {
              const msg = res.data?.error?.message ?? 'Không thể xác nhận.'
              Alert.alert('Lỗi', msg)
            }
          } catch {
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.')
          } finally {
            setCompleting(false)
          }
        },
      },
    ])
  }, [voucher])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !voucher) {
    return <ErrorState message="Không tìm thấy voucher." onRetry={load} />
  }

  const statusCfg = STATUS_CONFIG[voucher.status] ?? {
    label: voucher.status,
    bg: '#EDF1F8',
    color: colors.onSurfaceVariant,
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi tiết Voucher',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.serviceName}>{voucher.service_name ?? 'Dịch vụ'}</Text>

          <View style={styles.divider} />

          <InfoRow label="Mã voucher" value={voucher.id?.slice(0, 16).toUpperCase()} />
          <InfoRow label="Khách hàng" value={voucher.customer_name ?? '—'} />
          <InfoRow label="Giá trị" value={fmt(voucher.final_amount)} valueColor={colors.primary} />
          <InfoRow label="Ngày tạo" value={fmtDate(voucher.created_at)} />
          <InfoRow label="Ngày đổi" value={fmtDate(voucher.redeemed_at)} />
          <InfoRow label="Ngày hoàn thành" value={fmtDate(voucher.completed_at)} />
        </View>

        {/* Action */}
        {voucher.status === 'paid' && (
          <TouchableOpacity
            style={[styles.confirmBtn, completing && styles.confirmBtnDisabled]}
            onPress={handleComplete}
            disabled={completing}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>
              {completing ? 'Đang xác nhận...' : '✅ Xác nhận hoàn thành'}
            </Text>
          </TouchableOpacity>
        )}

        {voucher.status === 'redeemed' && (
          <TouchableOpacity
            style={[styles.confirmBtn, completing && styles.confirmBtnDisabled]}
            onPress={handleComplete}
            disabled={completing}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>
              {completing ? 'Đang xác nhận...' : '✅ Xác nhận cung cấp dịch vụ'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusText: { fontSize: 16, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
  },
  serviceName: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.surfaceContainerLow, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  infoLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
