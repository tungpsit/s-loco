import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
/**
 * Search Screen — search services with category + price filters
 */
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
import { colors, spacing, typography } from '../../lib/theme'
import CategoryChip from '../../src/components/category-chip'
import ErrorState from '../../src/components/error-state'
import ServiceCard from '../../src/components/service-card'
import { servicesApi } from '../../src/lib/api'

const CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa & Massage', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
]

const PRICE_RANGES = [
  { label: 'Tất cả', min: 0, max: Number.POSITIVE_INFINITY },
  { label: 'Dưới 100K', min: 0, max: 100000 },
  { label: '100K - 300K', min: 100000, max: 300000 },
  { label: '300K - 500K', min: 300000, max: 500000 },
  { label: 'Trên 500K', min: 500000, max: Number.POSITIVE_INFINITY },
]

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
    ({ item }: { item: any }) => (
      <View style={styles.cardWrap}>
        <ServiceCard item={item} onPress={() => router.push(`/service/${item.id}`)} />
      </View>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm</Text>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.input}
              placeholder="Tìm dịch vụ, cửa hàng..."
              placeholderTextColor={colors.outline}
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.slug}
            label={cat.name}
            icon={cat.icon}
            active={category === cat.slug}
            onPress={() => setCategory(category === cat.slug ? null : cat.slug)}
          />
        ))}
      </ScrollView>

      {/* Price filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.priceRow}
      >
        {PRICE_RANGES.map((r, idx) => (
          <TouchableOpacity
            key={r.label}
            style={[styles.priceChip, priceIdx === idx && styles.priceChipActive]}
            onPress={() => setPriceIdx(idx)}
          >
            <Text style={[styles.priceLabel, priceIdx === idx && styles.priceLabelActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {!hasSearched ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Khám phá Sầm Sơn</Text>
          <Text style={styles.emptyText}>Tìm nhà hàng, khách sạn, spa và dịch vụ hấp dẫn.</Text>
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          renderItem={renderService}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            !isLoading && items.length > 0 ? (
              <Text style={styles.resultCount}>{items.length} kết quả</Text>
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
              <View style={{ padding: spacing.base }}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ paddingVertical: 60 }}
                />
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { ...typography.headlineMd, marginBottom: spacing.md },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 48,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
    ...Platform.select({ web: { outline: 'none' } }),
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  chipsRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainer,
  },
  priceChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  priceLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  priceLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: { paddingBottom: spacing.xl },
  resultCount: {
    ...typography.bodySm,
    color: colors.outline,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  cardWrap: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, textAlign: 'center', color: colors.onSurfaceVariant },
})
