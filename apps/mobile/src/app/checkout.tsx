/**
 * Checkout Screen — Order review + payment gateway selection.
 * Phase 6: POST /payments/initiate with selected gateway.
 */
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PaymentMethodCard, { PAYMENT_GATEWAYS } from '../components/payment-method-card'
import { useOrderDetail } from '../hooks/useQuery'
import type { PaymentGateway } from '../components/payment-method-card'
import { paymentsApi } from '../lib/api'
import { borderRadius, colors, spacing, typography } from '../lib/theme'

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string; serviceId?: string }>()
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [paying, setPaying] = useState(false)

  const { data, isLoading, error } = useOrderDetail(orderId ?? '')

  async function handlePay() {
    if (!selectedGateway) {
      Alert.alert('Chưa chọn phương thức', 'Vui lòng chọn phương thức thanh toán.')
      return
    }
    if (!orderId) {
      Alert.alert('Lỗi', 'Không tìm thấy đơn hàng.')
      return
    }
    setPaying(true)
    try {
      const result = await paymentsApi.initiate(orderId, selectedGateway.id)
      if (result.payment_url) {
        await Linking.openURL(result.payment_url)
      }
      Alert.alert(
        'Thanh toán thành công',
        'Vui lòng hoàn tất thanh toán trên cổng và quay lại ứng dụng.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/vouchers') }],
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      Alert.alert('Lỗi thanh toán', msg, [{ text: 'OK' }])
    } finally {
      setPaying(false)
    }
  }

  const order = data?.order
  const totalAmount = order?.total_amount
    ? order.total_amount.toLocaleString('vi-VN')
    : null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Thanh toán</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn hàng</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Không tải được đơn hàng.</Text>
            </View>
          ) : order ? (
            <View style={styles.orderCard}>
              <Text style={styles.orderId}>Mã đơn #{order.id}</Text>
              {order.items?.map((item, i) => (
                <View key={i} style={styles.orderItem}>
                  <Text style={styles.orderItemName}>
                    {item.quantity}x {item.service_name}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    {item.price.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))}
              {totalAmount && (
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Tổng cộng</Text>
                  <Text style={styles.orderTotalAmount}>{totalAmount}đ</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Không tìm thấy đơn hàng.</Text>
            </View>
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <Text style={styles.sectionSub}>Chọn cổng thanh toán bạn muốn sử dụng</Text>
          {PAYMENT_GATEWAYS.map((gw) => (
            <PaymentMethodCard
              key={gw.id}
              gateway={gw}
              selected={selectedGateway?.id === gw.id}
              onSelect={setSelectedGateway}
            />
          ))}
        </View>
      </ScrollView>

      {/* Pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, (!selectedGateway || paying) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={!selectedGateway || paying}
          activeOpacity={0.75}
        >
          {paying ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.payBtnText}>
              {selectedGateway
                ? `Thanh toán qua ${selectedGateway.label}`
                : 'Chọn phương thức thanh toán'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: spacing.sm, paddingLeft: 0 },
  backBtnText: { ...typography.labelLg, color: colors.primary, fontWeight: '600' },
  title: { ...typography.titleMd, color: colors.onSurface },
  body: { paddingBottom: spacing.xl },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  sectionTitle: { ...typography.titleMd, marginBottom: spacing.sm },
  sectionSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  orderId: { ...typography.labelMd, color: colors.outline, marginBottom: spacing.sm },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderItemName: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  orderItemPrice: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  orderTotalLabel: { ...typography.titleSm, color: colors.onSurface },
  orderTotalAmount: { ...typography.titleMd, color: colors.primary },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  errorText: { ...typography.bodySm, color: colors.error },
  footer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: colors.outline,
  },
  payBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
