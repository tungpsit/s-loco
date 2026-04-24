import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ErrorState } from '../../src/components/error-state'
import { OrderCard } from '../../src/components/order-card'
import { RevenueCard } from '../../src/components/revenue-card'
import { dashboardApi } from '../../src/lib/api'
import { useResponsiveLayout } from '../../src/lib/responsive'
import { useAuthStore } from '../../src/stores/auth-store'

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

interface DashData {
  today?: { orders?: number; revenue?: number }
  total?: { revenue?: number }
  settlement?: { pending?: number; settled?: number }
  recentOrders?: Array<{
    id: string
    status: string
    service_name?: string
    customer_name?: string
    final_amount?: number
    created_at?: string
    redeemed_at?: string
  }>
}

const fmt = (n?: number) => (n != null ? `${Number(n).toLocaleString('vi-VN')}₫` : '0₫')

export default function DashboardScreen() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { isDesktop, pageMaxWidth, pagePadding } = useResponsiveLayout()

  const load = useCallback(async () => {
    try {
      const res = await dashboardApi.vendor()
      if (res.ok && res.data?.data) {
        setData(res.data.data as DashData)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 11) return 'Chào buổi sáng'
    if (h < 17) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: pagePadding, maxWidth: pageMaxWidth },
        isDesktop && styles.contentDesktop,
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.headerBg}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.vendorName}>{user?.full_name ?? 'Chủ cửa hàng'}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏪</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <View style={[styles.statCell, isDesktop && styles.statCellDesktop]}>
          <RevenueCard
            label="Đơn hôm nay"
            value={String(data?.today?.orders ?? 0)}
            icon="🛒"
            accentColor={colors.primary}
          />
        </View>
        <View style={[styles.statCell, isDesktop && styles.statCellDesktop]}>
          <RevenueCard
            label="Doanh thu hôm nay"
            value={fmt(data?.today?.revenue)}
            icon="💰"
            accentColor="#2E7D32"
          />
        </View>
        <View style={[styles.statCell, isDesktop && styles.statCellDesktop]}>
          <RevenueCard
            label="Chờ giải ngân"
            value={fmt(data?.settlement?.pending)}
            icon="⏳"
            accentColor="#E65100"
          />
        </View>
        <View style={[styles.statCell, isDesktop && styles.statCellDesktop]}>
          <RevenueCard
            label="Đã thanh toán"
            value={fmt(data?.settlement?.settled)}
            icon="✅"
            accentColor="#2E7D32"
          />
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <View style={styles.totalLeft}>
          <Text style={styles.totalLabel}>Tổng doanh thu</Text>
          <Text style={styles.totalValue}>{fmt(data?.total?.revenue)}</Text>
        </View>
        <Text style={styles.totalIcon}>📊</Text>
      </View>

      {/* Recent orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
          <Text style={styles.viewAllBtn} onPress={() => router.push('/(tabs)/orders')}>
            Xem tất cả ›
          </Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 32 }} />
        )}

        {error && !loading && <ErrorState onRetry={load} />}

        {!loading && !error && (!data?.recentOrders || data.recentOrders.length === 0) && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>Đơn hàng sẽ xuất hiện khi có khách đặt dịch vụ</Text>
          </View>
        )}

        {!loading &&
          !error &&
          data?.recentOrders &&
          data.recentOrders.length > 0 &&
          data.recentOrders
            .slice(0, 5)
            .map((o) => (
              <OrderCard key={o.id} voucher={o} onPress={() => router.push(`/voucher/${o.id}`)} />
            ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 24,
  },
  contentDesktop: {
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: '#90E0EF', fontWeight: '500' },
  vendorName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  headerBg: {
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    marginBottom: 16,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 22 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  statsGridDesktop: {
    gap: 14,
    marginBottom: 14,
  },
  statCell: { flexBasis: '48%', flexGrow: 1 },
  statCellDesktop: { flexBasis: '23%' },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLeft: {},
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  totalIcon: { fontSize: 36 },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  viewAllBtn: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.onSurface, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
})
