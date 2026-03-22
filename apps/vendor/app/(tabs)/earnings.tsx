import { StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  secondaryContainer: '#B8D4F0',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Thu nhập tháng này</Text>
        <Text style={styles.summaryValue}>— ₫</Text>
        <Text style={styles.summaryNote}>Cập nhật mỗi 24 giờ</Text>
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử thu nhập</Text>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40 }}>💰</Text>
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  summaryCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: colors.primaryFixed },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryNote: {
    fontSize: 12,
    color: colors.primaryFixed,
    marginTop: 8,
    opacity: 0.8,
  },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
})
