import { ScrollView, StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  primaryFixedDim: '#48CAE4',
  secondaryContainer: '#B8D4F0',
  onSecondaryContainer: '#1E3A5F',
  surface: '#F4F7FB',
  surfaceContainerLow: '#EDF1F8',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
}

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🏖️ S-Local</Text>
        <Text style={styles.heroSubtitle}>Khám phá Sầm Sơn</Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <View style={styles.categoryRow}>
          {[
            { icon: '🍜', name: 'Ẩm thực' },
            { icon: '🏨', name: 'Lưu trú' },
            { icon: '💆', name: 'Spa' },
            { icon: '🛺', name: 'Xe điện' },
            { icon: '🎠', name: 'Giải trí' },
            { icon: '🛍️', name: 'Mua sắm' },
          ].map((cat) => (
            <View key={cat.name} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryLabel}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Placeholder Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dành cho bạn</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ưu đãi hôm nay</Text>
          <Text style={styles.cardBody}>Khám phá các voucher giảm giá từ vendor địa phương.</Text>
        </View>
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>Địa điểm nổi bật</Text>
          <Text style={styles.cardBody}>Những nơi được yêu thích nhất tại Sầm Sơn.</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: colors.primaryContainer,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 16, color: colors.primaryFixed, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryItem: { alignItems: 'center', width: '30%' },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  cardBody: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
})
