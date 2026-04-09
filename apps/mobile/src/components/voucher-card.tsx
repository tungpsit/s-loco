import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import type { VoucherItem } from '../lib/api'

const STATUS_LABELS: Record<string, string> = {
  created: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  redeemed: 'Đã đổi',
  completed: 'Hoàn thành',
  settled: 'Đã quyết toán',
  refunded: 'Đã hoàn tiền',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  created: { bg: '#FEF9C3', text: '#854D0E' },
  paid: { bg: colors.secondaryContainer, text: colors.onSecondaryContainer },
  redeemed: { bg: colors.primaryFixed, text: colors.primary },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  settled: { bg: '#D1FAE5', text: '#065F46' },
  refunded: { bg: '#FEE2E2', text: '#991B1B' },
  expired: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant },
  cancelled: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant },
}

interface Props {
  item: VoucherItem
  onPress?: () => void
}

export default function VoucherCard({ item, onPress }: Props) {
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.created!

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🎫</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {item.service_name ?? 'Voucher'}
          </Text>
          <Text style={styles.vendorName} numberOfLines={1}>
            {item.vendor_name ?? ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {item.total_amount != null && (
          <Text style={styles.amount}>{item.total_amount.toLocaleString('vi-VN')}₫</Text>
        )}
        {item.created_at && (
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  serviceName: {
    ...typography.titleMd,
  },
  vendorName: {
    ...typography.bodySm,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  amount: {
    ...typography.titleMd,
    color: colors.primary,
  },
  date: {
    ...typography.bodySm,
  },
})
