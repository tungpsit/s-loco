import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Settlement } from '../lib/api'

const colors = {
  primary: '#005E97',
  surfaceContainerLowest: '#FFFFFF',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#E65100' },
  approved: { label: 'Đã duyệt', color: '#1565C0' },
  disbursed: { label: 'Đã giải ngân', color: '#2E7D32' },
  rejected: { label: 'Từ chối', color: '#C62828' },
}

interface SettlementItemProps {
  settlement: Settlement
  onPress?: () => void
}

export function SettlementItem({ settlement, onPress }: SettlementItemProps) {
  const statusCfg = STATUS_CONFIG[settlement.status] ?? {
    label: settlement.status,
    color: colors.onSurfaceVariant,
  }

  const fmt = (n?: number) =>
    n != null ? Number(n).toLocaleString('vi-VN') + '₫' : '—'

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) : '—'

  const periodStart = fmtDate(settlement.period_start)
  const periodEnd = fmtDate(settlement.period_end)

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.period}>
            {periodStart} → {periodEnd}
          </Text>
          <Text style={styles.voucherCount}>
            {settlement.voucher_count ?? 0} voucher
          </Text>
        </View>
        <View style={styles.rightInfo}>
          <Text style={styles.netAmount}>{fmt(settlement.net_amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '1A' }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.detail}>Giá trị: {fmt(settlement.total_amount)}</Text>
        <Text style={styles.detail}>Hoa hồng: {fmt(settlement.commission_amount)}</Text>
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
  period: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 2,
  },
  voucherCount: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  rightInfo: { alignItems: 'flex-end' },
  netAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detail: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
})
