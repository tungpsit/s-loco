import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { vendor } from '../../lib/api'

const colors = {
  primary: '#005E97', surface: '#F4F7FB', onSurface: '#161B2E', onSurfaceVariant: '#3B4460',
}

export default function EarningsScreen() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await vendor.dashboard()
      if (res.ok) setData(res.data?.data)
    } catch {}
    setLoading(false)
  }

  const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '0'

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Thu nhập</Text></View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 60 }} />
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
            <Text style={styles.summaryValue}>{fmt(data?.totalRevenue)}₫</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.halfLabel}>Đã nhận</Text>
              <Text style={[styles.halfValue, { color: '#2E7D32' }]}>{fmt(data?.settledAmount)}₫</Text>
            </View>
            <View style={styles.halfCard}>
              <Text style={styles.halfLabel}>Chờ giải ngân</Text>
              <Text style={[styles.halfValue, { color: '#E65100' }]}>{fmt(data?.pendingSettlement)}₫</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hoa hồng nền tảng: 8%</Text>
            <Text style={styles.note}>Nền tảng giữ lại 8% hoa hồng trên mỗi đơn hàng. Phần còn lại được giải ngân theo chu kỳ 3 ngày hoặc tức thời.</Text>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  summaryCard: { margin: 16, backgroundColor: colors.primary, borderRadius: 20, padding: 24, alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#FFF', opacity: 0.8 },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#FFF', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  halfCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center' },
  halfLabel: { fontSize: 13, color: colors.onSurfaceVariant },
  halfValue: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  note: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 20 },
})
