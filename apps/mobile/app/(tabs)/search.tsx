import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { services } from '../../lib/api'

const colors = {
  primary: '#005E97', primaryFixed: '#90E0EF', surface: '#F4F7FB',
  onSurface: '#161B2E', onSurfaceVariant: '#3B4460',
}

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await services.search(query.trim())
      setResults(res.data?.data?.items || res.data?.data || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Tìm dịch vụ, nhà hàng, spa..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={{ color: '#FFF', fontWeight: '600' }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 60 }} />
      ) : searched && results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
          <Text style={styles.emptyText}>Không tìm thấy kết quả cho "{query}"</Text>
        </View>
      ) : (
        results.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardTitle}>{s.name}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{s.description || ''}</Text>
            <Text style={styles.price}>{Number(s.price || 0).toLocaleString('vi-VN')}₫</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.onSurface },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  cardBody: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 8 },
})
