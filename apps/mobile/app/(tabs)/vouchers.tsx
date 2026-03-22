import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { vouchers as voucherApi } from '../../lib/api'

const colors = {
  primary: '#005E97', primaryFixed: '#90E0EF', surface: '#F4F7FB',
  onSurface: '#161B2E', onSurfaceVariant: '#3B4460', error: '#BA1A1A',
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: 'Đã thanh toán', color: '#005E97' },
  redeemed: { label: 'Đã sử dụng', color: '#2E7D32' },
  completed: { label: 'Hoàn thành', color: '#388E3C' },
  expired: { label: 'Hết hạn', color: '#757575' },
  refunded: { label: 'Hoàn tiền', color: '#E65100' },
  created: { label: 'Chờ TT', color: '#F9A825' },
}

export default function VouchersScreen() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadVouchers() }, [])

  async function loadVouchers() {
    try {
      const res = await voucherApi.list()
      setData(res.data?.data?.items || res.data?.data || [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voucher của tôi</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 60 }} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎫</Text>
          <Text style={styles.emptyTitle}>Chưa có voucher nào</Text>
          <Text style={styles.emptyText}>Mua dịch vụ để nhận voucher và xuất trình QR khi sử dụng.</Text>
        </View>
      ) : (
        data.map((v: any) => {
          const s = STATUS_MAP[v.status] || { label: v.status, color: '#757575' }
          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{v.serviceName || `Voucher #${v.id?.slice(0, 8)}`}</Text>
                <View style={[styles.badge, { backgroundColor: s.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={styles.code}>Mã: {v.code || v.id?.slice(0, 12)}</Text>
              {v.expiresAt && <Text style={styles.meta}>HSD: {new Date(v.expiresAt).toLocaleDateString('vi-VN')}</Text>}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.onSurface, marginBottom: 6 },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  code: { fontSize: 13, fontWeight: '500', color: colors.primary, marginTop: 8, fontFamily: 'monospace' },
  meta: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
})
