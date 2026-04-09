import { useEffect, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { settlementApi } from '../../src/lib/api'
import { ErrorState } from '../../src/components/error-state'
import type { Settlement } from '../../src/lib/api'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EDF1F8',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#E65100' },
  approved: { label: 'Đã duyệt', color: '#1565C0' },
  disbursed: { label: 'Đã giải ngân', color: '#2E7D32' },
  rejected: { label: 'Từ chối', color: '#C62828' },
}

const fmt = (n?: number) =>
  n != null ? Number(n).toLocaleString('vi-VN') + '₫' : '—'

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

export default function SettlementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await settlementApi.detail(id!)
      if (res.ok && res.data?.data) {
        setSettlement(res.data.data as Settlement)
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !settlement) {
    return <ErrorState message="Không tìm thấy thanh toán." onRetry={load} />
  }

  const statusCfg = STATUS_CONFIG[settlement.status] ?? {
    label: settlement.status,
    color: colors.onSurfaceVariant,
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi tiết thanh toán',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Status */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '1A' }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
          <Text style={styles.netAmount}>{fmt(settlement.net_amount)}</Text>
          <Text style={styles.netLabel}>Số tiền thực nhận</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>

          <BreakdownRow label="Tổng giá trị voucher" value={fmt(settlement.total_amount)} />
          <BreakdownRow
            label="Hoa hồng nền tảng (8%)"
            value={fmt(settlement.commission_amount)}
            valueColor="#E65100"
          />
          <BreakdownRow
            label="Thực nhận"
            value={fmt(settlement.net_amount)}
            valueColor={colors.primary}
            bold
          />
        </View>

        {/* Period */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Kỳ thanh toán</Text>
          <InfoRow label="Từ ngày" value={fmtDate(settlement.period_start)} />
          <InfoRow label="Đến ngày" value={fmtDate(settlement.period_end)} />
          <InfoRow label="Số voucher" value={String(settlement.voucher_count ?? 0)} />
          <InfoRow
            label="Ngày tạo"
            value={fmtDate(settlement.created_at)}
          />
          {settlement.disbursed_at && (
            <InfoRow
              label="Ngày giải ngân"
              value={fmtDate(settlement.disbursed_at)}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function BreakdownRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string
  value: string
  valueColor?: string
  bold?: boolean
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, bold && { fontWeight: '700' }]}>{label}</Text>
      <Text
        style={[
          styles.breakdownValue,
          bold && { fontWeight: '700' },
          valueColor ? { color: valueColor } : {},
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  statusCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 12,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  netAmount: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  netLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  breakdownCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface, marginBottom: 14 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  breakdownLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  infoLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
})
