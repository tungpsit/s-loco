import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { services } from '../../lib/api'

const colors = {
  primary: '#005E97', primaryContainer: '#0077B6', primaryFixed: '#90E0EF',
  primaryFixedDim: '#48CAE4', secondaryContainer: '#B8D4F0', onSecondaryContainer: '#1E3A5F',
  surface: '#F4F7FB', surfaceContainerLow: '#EDF1F8', onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460', outline: '#6B7694',
}

const CATEGORIES = [
  { icon: '🍜', key: 'food', name: 'Ẩm thực' },
  { icon: '🏨', key: 'hotel', name: 'Lưu trú' },
  { icon: '💆', key: 'spa', name: 'Spa' },
  { icon: '🛺', key: 'transport', name: 'Xe điện' },
  { icon: '🎠', key: 'entertainment', name: 'Giải trí' },
  { icon: '🛍️', key: 'shopping', name: 'Mua sắm' },
]

export default function HomeScreen() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    loadServices()
  }, [category])

  async function loadServices() {
    setLoading(true)
    try {
      const res = await services.list({ category: category || undefined })
      setData(res.data?.data?.items || res.data?.data || [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🏖️ S-Loco</Text>
        <Text style={styles.heroSubtitle}>Khám phá Sầm Sơn</Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryItem}
              onPress={() => setCategory(category === cat.key ? null : cat.key)}
            >
              <View style={[styles.categoryIcon, category === cat.key && { backgroundColor: colors.primaryContainer }]}>
                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              </View>
              <Text style={[styles.categoryLabel, category === cat.key && { color: colors.primary, fontWeight: '700' }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{category ? CATEGORIES.find(c => c.key === category)?.name || 'Dịch vụ' : 'Dành cho bạn'}</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 40 }} />
        ) : data.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chưa có dịch vụ</Text>
            <Text style={styles.cardBody}>Dịch vụ sẽ hiển thị khi vendor đăng ký.</Text>
          </View>
        ) : (
          data.map((s: any) => (
            <View key={s.id} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <Text style={styles.cardBody} numberOfLines={2}>{s.description || 'Dịch vụ tại Sầm Sơn'}</Text>
              <Text style={styles.price}>{Number(s.price || 0).toLocaleString('vi-VN')}₫</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, backgroundColor: colors.primaryContainer, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 16, color: colors.primaryFixed, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  categoryItem: { alignItems: 'center', width: '30%' },
  categoryIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  cardBody: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 8 },
})
