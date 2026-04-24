import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Voucher } from '../lib/api'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  surfaceContainerLow: '#EDF1F8',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  tertiary: '#3F3D99',
  tertiaryContainer: '#5856D6',
  error: '#BA1A1A',
  success: '#2E7D32',
  warning: '#E65100',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  created: { label: 'Mới tạo', bg: '#E3F2FD', color: '#1565C0' },
  paid: { label: 'Đã thanh toán', bg: '#E8F5E9', color: '#2E7D32' },
  redeemed: { label: 'Đã đổi', bg: '#FFF3E0', color: '#E65100' },
  completed: { label: 'Hoàn thành', bg: '#E8F5E9', color: '#2E7D32' },
  settled: { label: 'Đã thanh toán', bg: '#F3E5F5', color: '#7B1FA2' },
  refunded: { label: 'Hoàn tiền', bg: '#FFEBEE', color: '#C62828' },
  expired: { label: 'Hết hạn', bg: '#ECEFF1', color: '#546E7A' },
  cancelled: { label: 'Đã hủy', bg: '#FFEBEE', color: '#C62828' },
}

interface OrderCardProps {
  voucher: Voucher
  onPress?: () => void
}

export function OrderCard({ voucher, onPress }: OrderCardProps) {
  const statusCfg = STATUS_CONFIG[voucher.status] ?? {
    label: voucher.status,
    bg: colors.surfaceContainerLow,
    color: colors.onSurfaceVariant,
  }

  const fmtAmount = (n?: number | string) => {
    if (n == null) return '—'
    return `${Number(n).toLocaleString('vi-VN')}₫`
  }

  const fmtDate = (d?: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {voucher.service_name ?? 'Dịch vụ'}
          </Text>
          {voucher.customer_name && (
            <Text style={styles.customerName}>👤 {voucher.customer_name}</Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.date}>{fmtDate(voucher.redeemed_at ?? voucher.created_at)}</Text>
        <Text style={styles.amount}>{fmtAmount(voucher.final_amount)}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceInfo: { flex: 1, marginRight: 10 },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
})
