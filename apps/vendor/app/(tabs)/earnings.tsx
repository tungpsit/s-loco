import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { dashboardApi, settlementApi } from '../../src/lib/api'
import { SettlementItem } from '../../src/components/settlement-item'
import { ErrorState } from '../../src/components/error-state'
import type { Settlement } from '../../src/lib/api'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

const fmt = (n?: number) =>
  n != null ? Number(n).toLocaleString('vi-VN') + '₫' : '0₫'

export default function EarningsScreen() {
  const [dashData, setDashData] = useState<{
    settlement?: { pending?: number; settled?: number }
    total?: { revenue?: number }
  } | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const [dashRes, settleRes] = await Promise.all([
        dashboardApi.vendor(),
        settlementApi.list({ page: 1, limit: 20 }),
      ])

      if (dashRes.ok && dashRes.data?.data) {
        setDashData(dashRes.data.data as typeof dashData)
      }
      if (settleRes.ok && settleRes.data?.data) {
        const items: Settlement[] =
          settleRes.data.data?.items ?? settleRes.data.data?.data ?? []
        setSettlements(items)
      }
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thu nhập</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
            <Text style={styles.summaryValue}>{fmt(dashData?.total?.revenue)}</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Đã thanh toán</Text>
            <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
              {fmt(dashData?.settlement?.settled)}
            </Text>
          </View>
          <View style={styles.summaryDividerVertical} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Chờ giải ngân</Text>
            <Text style={[styles.summaryValue, { color: '#E65100' }]}>
              {fmt(dashData?.settlement?.pending)}
            </Text>
          </View>
        </View>
      </View>

      {/* Commission note */}
      <View style={styles.commissionNote}>
        <Text style={styles.commissionNoteText}>💡 Hoa hồng nền tảng: 8%</Text>
        <Text style={styles.commissionNoteSub}>
          Nền tảng giữ lại 8% hoa hồng. Phần còn lại được giải ngân theo chu kỳ 3 ngày hoặc tức thời.
        </Text>
      </View>

      {/* Settlement list */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>
      </View>

      {loading && settlements.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, paddingVertical: 40 }} />
      ) : error && settlements.length === 0 ? (
        <ErrorState onRetry={load} />
      ) : settlements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>💳</Text>
          <Text style={styles.emptyText}>Chưa có thanh toán nào</Text>
        </View>
      ) : (
        <FlatList
          data={settlements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SettlementItem
              settlement={item}
              onPress={() => router.push(`/settlement/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  summaryDividerVertical: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 },
  commissionNote: {
    marginHorizontal: 16,
    backgroundColor: '#EDF1F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  commissionNoteText: { fontSize: 13, fontWeight: '600', color: colors.onSurface, marginBottom: 4 },
  commissionNoteSub: { fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 17 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.onSurfaceVariant },
})
