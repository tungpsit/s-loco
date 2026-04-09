import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
/**
 * Checkout Screen — order summary, create order, redirect to payment
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import { ordersApi } from '../../src/lib/api'
import { useOrderStore } from '../../src/stores/order-store'

const GATEWAYS = [
  { key: 'vnpay', label: 'VNPay', icon: '💳' },
  { key: 'momo', label: 'MoMo', icon: '📱' },
  { key: 'sepay', label: 'SePay', icon: '🏦' },
]

export default function CheckoutScreen() {
  const { items, total, clear } = useOrderStore()
  const qc = useQueryClient()
  const [gateway, setGateway] = useState<string>('vnpay')
  const [note, setNote] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      ordersApi.create(
        items.map((i) => ({ service_id: i.service.id, quantity: i.quantity })),
        note || undefined,
      ),
    onSuccess: async (res) => {
      const orderId = res?.order?.id
      if (!orderId) {
        Alert.alert('Lỗi', 'Không tạo được đơn hàng.')
        return
      }
      // Pay immediately (mock flow for dev)
      try {
        await ordersApi.detail(orderId) // just to verify
      } catch {}
      clear()
      qc.invalidateQueries({ queryKey: ['orders'] })
      router.replace(`/order/${orderId}`)
    },
    onError: (e: any) => {
      Alert.alert('Lỗi', e.message ?? 'Không thể tạo đơn hàng.')
    },
  })

  function handlePlaceOrder() {
    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm dịch vụ trước.')
      return
    }
    createMutation.mutate()
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn hàng của bạn</Text>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyText}>Giỏ hàng trống</Text>
            </View>
          ) : (
            items.map(({ service, quantity }) => (
              <View key={service.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{service.name}</Text>
                  <Text style={styles.itemQty}>x{quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {(
                    (service.discount_price ?? service.original_price ?? 0) * quantity
                  ).toLocaleString('vi-VN')}
                  ₫
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Payment Gateway */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.gateways}>
            {GATEWAYS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.gateway, gateway === g.key && styles.gatewayActive]}
                onPress={() => setGateway(g.key)}
              >
                <Text style={styles.gatewayIcon}>{g.icon}</Text>
                <Text style={[styles.gatewayLabel, gateway === g.key && styles.gatewayLabelActive]}>
                  {g.label}
                </Text>
                {gateway === g.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalAmount}>{total().toLocaleString('vi-VN')}₫</Text>
        </View>
      </ScrollView>

      {/* Place Order */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeBtn,
            (createMutation.isPending || items.length === 0) && styles.placeBtnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={createMutation.isPending || items.length === 0}
          activeOpacity={0.8}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.placeBtnText}>Thanh toán {total().toLocaleString('vi-VN')}₫</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: 120 },
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
  itemQty: { ...typography.bodySm, color: colors.outline },
  itemPrice: { ...typography.titleMd, color: colors.primary },
  emptyCart: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyEmoji: { fontSize: 36 },
  emptyText: { ...typography.bodyMd, color: colors.outline, marginTop: spacing.sm },
  gateways: { gap: spacing.sm },
  gateway: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    gap: spacing.md,
  },
  gatewayActive: {
    backgroundColor: colors.primaryFixed,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  gatewayIcon: { fontSize: 20 },
  gatewayLabel: { flex: 1, ...typography.bodyMd },
  gatewayLabelActive: { color: colors.primary, fontWeight: '600' },
  checkmark: { color: colors.primary, fontWeight: '700' },
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.base,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  placeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(22, 27, 46, 0.12)' },
      default: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
      },
    }),
  },
  placeBtnDisabled: { opacity: 0.55 },
  placeBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
})
