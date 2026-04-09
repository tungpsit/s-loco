/**
 * Browse Screen — search + category filter + service/vendor listing.
 */
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
import ErrorState from '../../components/error-state'
import ServiceCard from '../../components/service-card'
import { useServices, useVendors } from '../../hooks/useQuery'
import type { ServiceItem, VendorCard } from '../../lib/api'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'

const CATEGORIES = [
  { slug: '', label: 'Tất cả' },
  { slug: 'am-thuc', label: 'Ẩm thực' },
  { slug: 'luu-tru', label: 'Lưu trú' },
  { slug: 'spa-massage', label: 'Spa' },
  { slug: 'xe-dien', label: 'Xe điện' },
  { slug: 'giai-tri', label: 'Giải trí' },
  { slug: 'mua-sam', label: 'Mua sắm' },
]

type Tab = 'services' | 'vendors'

export default function BrowseScreen() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState<Tab>('services')

  const {
    data: svcData,
    isLoading: svcLoading,
    error: svcError,
    refetch: svcRefetch,
  } = useServices({
    q: query || undefined,
    category: category || undefined,
    limit: 20,
  })

  const { data: vendorData, isLoading: vendorLoading } = useVendors({
    q: query || undefined,
    category: category || undefined,
  })

  const services: ServiceItem[] = svcData?.items ?? []
  const vendors: VendorCard[] = vendorData?.items ?? []
  const isLoading = view === 'services' ? svcLoading : vendorLoading
  const error = view === 'services' ? svcError : null

  const renderService = useCallback(
    ({ item }: { item: ServiceItem }) => (
      <View style={styles.cardWrap}>
        <ServiceCard item={item} onPress={() => router.push(`/service/${item.id}`)} />
      </View>
    ),
    [],
  )

  const renderVendor = useCallback(
    ({ item }: { item: VendorCard }) => (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => router.push(`/vendor/${item.slug ?? item.id}`)}
        activeOpacity={0.75}
      >
        <View style={[styles.vendorImage, { backgroundColor: colors.surfaceContainerLow }]}>
          {item.image_url ? (
            <View style={styles.vendorImageInner} />
          ) : (
            <Text style={styles.vendorEmoji}>🏪</Text>
          )}
        </View>
        <View style={styles.vendorContent}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.address && (
            <Text style={styles.vendorAddress} numberOfLines={1}>
              📍 {item.address}
            </Text>
          )}
          {item.rating != null && (
            <Text style={styles.vendorRating}>★ {item.rating.toFixed(1)}</Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm dịch vụ, cửa hàng..."
          placeholderTextColor={colors.outline}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.chip, category === cat.slug && styles.chipActive]}
            onPress={() => setCategory(cat.slug)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, category === cat.slug && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, view === 'services' && styles.tabActive]}
          onPress={() => setView('services')}
        >
          <Text style={[styles.tabText, view === 'services' && styles.tabTextActive]}>Dịch vụ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'vendors' && styles.tabActive]}
          onPress={() => setView('vendors')}
        >
          <Text style={[styles.tabText, view === 'vendors' && styles.tabTextActive]}>Cửa hàng</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ErrorState onRetry={svcRefetch} />
      ) : view === 'services' ? (
        <FlatList
          data={services}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy</Text>
              <Text style={styles.emptyText}>Thử từ khóa khác hoặc bỏ lọc danh mục.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendor}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyTitle}>Không có cửa hàng</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
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
    paddingBottom: spacing.sm,
  },
  title: { ...typography.headlineMd },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    ...Platform.select({ web: { border: 'none' } }),
  } as object,
  categories: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primaryFixed,
  },
  tabText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { paddingHorizontal: spacing.base, gap: spacing.md },
  list: { paddingBottom: spacing.xl },
  cardWrap: { flex: 1, marginBottom: spacing.md },
  cardLeft: { marginRight: spacing.xs },
  cardRight: { marginLeft: spacing.xs },
  vendorCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  vendorImage: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorImageInner: { width: '100%', height: '100%' },
  vendorEmoji: { fontSize: 36, opacity: 0.5 },
  vendorContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  vendorName: { ...typography.titleMd },
  vendorAddress: { ...typography.bodySm, color: colors.onSurfaceVariant },
  vendorRating: { ...typography.labelMd, color: '#F59E0B' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
})
