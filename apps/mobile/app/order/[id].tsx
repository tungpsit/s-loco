import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import { ordersApi } from '../../src/lib/api'

const STATUS_LABELS: Record<string, string> = {
  created: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  partially_refunded: 'Hoàn tiền một phần',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  created: '#F59E0B',
  paid: colors.primary,
  partially_refunded: '#7C3AED',
  refunded: colors.error,
  cancelled: colors.outline,
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.detail(id!),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  })

  const order = data?.order

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !order) {
    return <ErrorState onRetry={() => {}} />
  }

  const canCancel = order.status === 'created'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View
        style={[
          styles.statusCard,
          { borderLeftColor: STATUS_COLORS[order.status] ?? colors.outline },
        ]}
      >
        <Text style={[styles.statusLabel, { color: STATUS_COLORS[order.status] }]}>
          {STATUS_LABELS[order.status] ?? order.status}
        </Text>
        <Text style={styles.orderId}>Mã đơn: {order.id?.slice(0, 8)}</Text>
        {order.created_at && (
          <Text style={styles.orderDate}>
            Ngày tạo:{' '}
            {new Date(order.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dịch vụ đã đặt</Text>
        {order.items?.map((item: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.service_name ?? 'Dịch vụ'}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {(item.price * item.quantity).toLocaleString('vi-VN')}₫
            </Text>
          </View>
        ))}
      </View>

      {/* Note */}
      {order.note && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <Text style={styles.note}>{order.note}</Text>
        </View>
      )}

      {/* Vouchers */}
      {!!(order.vouchers && order.vouchers.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voucher</Text>
          {(order.vouchers ?? []).map((v: any) => (
            <TouchableOpacity
              key={v.id}
              style={styles.voucherRow}
              onPress={() => router.push(`/voucher/${v.id}`)}
            >
              <Text style={styles.voucherName}>{v.service_name ?? 'Voucher'}</Text>
              <Text style={styles.voucherArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.totalAmount}>{(order.total_amount ?? 0).toLocaleString('vi-VN')}₫</Text>
      </View>

      {/* Actions */}
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>
            {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đơn'}
          </Text>
        </TouchableOpacity>
      )}
      {order.status === 'paid' && (
        <TouchableOpacity style={styles.payBtn} onPress={() => router.push(`/order/${order.id}`)}>
          <Text style={styles.payBtnText}>Xem voucher</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  statusCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  statusLabel: { ...typography.titleLg, marginBottom: spacing.xs },
  orderId: { ...typography.bodySm, color: colors.outline, fontFamily: 'monospace' },
  orderDate: { ...typography.bodySm, color: colors.outline, marginTop: 2 },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.titleMd, marginBottom: spacing.md },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  itemInfo: { flex: 1 },
  itemName: { ...typography.bodyMd },
  itemQty: { ...typography.bodySm, color: colors.outline, marginTop: 2 },
  itemPrice: { ...typography.titleMd, color: colors.primary },
  note: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 20 },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  voucherName: { flex: 1, ...typography.bodyMd },
  voucherArrow: { color: colors.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  totalLabel: { ...typography.titleLg },
  totalAmount: { ...typography.headlineMd, color: colors.primary },
  cancelBtn: {
    backgroundColor: 'rgba(186,26,26,0.08)',
    borderRadius: 48,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cancelBtnText: { color: colors.error, fontWeight: '600', fontSize: 15 },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
})
