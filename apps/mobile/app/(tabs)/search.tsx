import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, shadows, spacing, typography } from '../../lib/theme'
import CategoryChip from '../../src/components/category-chip'
import ErrorState from '../../src/components/error-state'
import ServiceCard from '../../src/components/service-card'
import { servicesApi } from '../../src/lib/api'

const CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
]

const PRICE_RANGES = ['Tất cả', 'Dưới 100K', '100K - 300K', '300K - 500K', 'Trên 500K']

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [priceIdx, setPriceIdx] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', keyword, category, priceIdx],
    queryFn: () =>
      servicesApi.list({
        q: keyword || undefined,
        category: category ?? undefined,
        page: 1,
        limit: 20,
      }),
    enabled: hasSearched,
  })

  const items = data?.items ?? []

  function handleSearch() {
    setHasSearched(true)
  }

  const renderService = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View style={[styles.cardWrap, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
        <ServiceCard item={item} onPress={() => router.push(`/service/${item.id}`)} />
      </View>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DISCOVER S-LOCO</Text>
        <Text style={styles.title}>Tìm trải nghiệm</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Tìm nhà hàng, khách sạn, dịch vụ..."
            placeholderTextColor="rgba(255,255,255,0.72)"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.slug}
                label={cat.name}
                icon={cat.icon}
                active={category === cat.slug}
                onPress={() => setCategory(category === cat.slug ? null : cat.slug)}
              />
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.priceRow}>
            {PRICE_RANGES.map((label, idx) => (
              <TouchableOpacity
                key={label}
                style={[styles.priceChip, priceIdx === idx && styles.priceChipActive]}
                onPress={() => setPriceIdx(idx)}
              >
                <Text style={[styles.priceLabel, priceIdx === idx && styles.priceLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {!hasSearched ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌊</Text>
          <Text style={styles.emptyTitle}>Bạn đang tìm gì ở Sầm Sơn?</Text>
          <Text style={styles.emptyText}>Nhập từ khóa hoặc chọn danh mục để bắt đầu.</Text>
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          renderItem={renderService}
          keyExtractor={(item: any) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            !isLoading && items.length > 0 ? (
              <Text style={styles.resultCount}>{items.length} kết quả phù hợp</Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🏝️</Text>
                <Text style={styles.emptyTitle}>Không tìm thấy</Text>
                <Text style={styles.emptyText}>Thử từ khóa hoặc bộ lọc khác.</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color={colors.primary} style={{ paddingTop: 80 }} />
            )
          }
          ListFooterComponent={<View style={{ height: 108 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 46,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)', fontWeight: '800' },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.white,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  searchBox: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.base,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.white,
    ...Platform.select({ web: { outline: 'none' } }),
  },
  searchBtn: {
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  searchBtnText: { color: colors.primary, fontWeight: '800' },
  filterPanel: {
    marginHorizontal: spacing.base,
    marginTop: -28,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  priceChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainerLow,
  },
  priceChipActive: { backgroundColor: colors.primary },
  priceLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  priceLabelActive: { color: colors.white, fontWeight: '800' },
  list: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  resultCount: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  row: { paddingHorizontal: spacing.base, gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  cardLeft: { marginRight: spacing.xs },
  cardRight: { marginLeft: spacing.xs },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleLg, textAlign: 'center', marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, textAlign: 'center', color: colors.onSurfaceVariant },
})
