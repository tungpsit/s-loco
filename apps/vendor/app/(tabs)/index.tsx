import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { vendor } from '../../lib/api'

const colors = {
  primary: '#005E97', primaryContainer: '#0077B6', primaryFixed: '#90E0EF',
  surface: '#F4F7FB', onSurface: '#161B2E', onSurfaceVariant: '#3B4460',
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      const res = await vendor.dashboard()
      if (res.ok) setStats(res.data?.data)
    } catch {}
    setLoading(false)
  }

  const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '0'

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 S-Loco Vendor</Text>
        <Text style={styles.headerSub}>Quản lý đơn hàng</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 60 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="Đơn hôm nay" value={fmt(stats?.todayOrders)} icon="🛒" />
            <StatCard label="Doanh thu hôm nay" value={`${fmt(stats?.todayRevenue)}₫`} icon="💰" />
            <StatCard label="Chờ xác nhận" value={fmt(stats?.pendingOrders)} icon="⏳" />
            <StatCard label="Tổng doanh thu" value={`${fmt(stats?.totalRevenue)}₫`} icon="📊" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
                <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
              </View>
            ) : (
              stats.recentOrders.map((o: any) => (
                <View key={o.id} style={styles.orderCard}>
                  <Text style={styles.orderTitle}>Đơn #{o.id?.slice(0, 8)}</Text>
                  <Text style={styles.orderAmount}>{fmt(o.finalAmount)}₫</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24, backgroundColor: colors.primaryContainer, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 14, color: colors.primaryFixed, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  statCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface, marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant },
  orderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  orderAmount: { fontSize: 16, fontWeight: '700', color: colors.primary },
})
