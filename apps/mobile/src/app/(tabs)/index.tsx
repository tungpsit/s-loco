/**
 * Home Screen — Trang chủ: hero banner, category grid, featured vendors.
 */
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ServiceCardSkeleton } from '../../components/loading-skeleton'
import ServiceCard from '../../components/service-card'
import { useServices } from '../../hooks/useQuery'
import type { ServiceItem } from '../../lib/api'
import { borderRadius, colors, glass, spacing, typography } from '../../lib/theme'

const CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa & Massage', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
]

const BANNERS = [
  {
    id: '1',
    title: 'Tết Sầm Sơn 2026',
    subtitle: 'Ưu đãi lên đến 30%',
    emoji: '🎆',
    bg: colors.primaryContainer,
  },
  {
    id: '2',
    title: 'Khám phá ẩm thực',
    subtitle: 'Top 10 nhà hàng ngon',
    emoji: '🍽️',
    bg: '#FEF3C7',
  },
]

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null)

  const { data, isLoading } = useServices({
    category: category ?? undefined,
    limit: 20,
  })

  const items: ServiceItem[] = data?.items ?? []

  const renderService = useCallback(
    ({ item, index }: { item: ServiceItem; index: number }) => (
      <View style={[styles.cardWrap, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
        <ServiceCard item={item} onPress={() => router.push(`/service/${item.id}`)} />
      </View>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Floating header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào! 👋</Text>
          <Text style={styles.headerTitle}>S-Loco</Text>
        </View>
        <TouchableOpacity
          style={styles.weatherBtn}
          onPress={() => router.push('/content/weather')}
          accessibilityLabel="Thời tiết"
        >
          <Text style={styles.weatherIcon}>🌤️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={isLoading ? Array(4).fill(null) : items}
        renderItem={isLoading ? () => <ServiceCardSkeleton /> : renderService}
        keyExtractor={(item: ServiceItem | null) => item?.id ?? String(Math.random())}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroTagline}>Khám phá Sầm Sơn</Text>
              <Text style={styles.heroTitle}>S-Loco</Text>
              <Text style={styles.heroSub}>Ẩm thực · Lưu trú · Giải trí</Text>
            </View>

            {/* Banners */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.banners}
            >
              {BANNERS.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.banner, { backgroundColor: b.bg }]}
                  onPress={() => router.push('/ai')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                  <View>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerSub}>{b.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.slug}
                    style={[
                      styles.categoryItem,
                      category === cat.slug && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(category === cat.slug ? null : cat.slug)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        category === cat.slug && styles.categoryIconWrapActive,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.slug && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section heading */}
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionTitle}>
                {category
                  ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Dịch vụ')
                  : 'Dành cho bạn'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
                <Text style={styles.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏖️</Text>
              <Text style={styles.emptyTitle}>Chưa có dịch vụ</Text>
              <Text style={styles.emptyText}>Dịch vụ sẽ hiển thị khi vendor đăng ký.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: glass.header.backgroundColor,
    zIndex: 10,
  } as ViewStyle,
  greeting: { ...typography.bodySm, color: colors.onSurfaceVariant },
  headerTitle: { ...typography.headlineMd },
  weatherBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: { fontSize: 22 },
  list: { paddingBottom: spacing.xl },
  hero: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  heroTagline: {
    ...typography.labelMd,
    color: colors.primaryFixed,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  heroSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.7)' },
  banners: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  banner: {
    width: 200,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerEmoji: { fontSize: 32 },
  bannerTitle: { ...typography.titleSm, fontWeight: '600', color: colors.onSurface },
  bannerSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.md },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  seeAll: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  categoryItemActive: {
    backgroundColor: colors.primaryFixed,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: { fontSize: 24 },
  categoryLabel: {
    ...typography.labelMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  row: { paddingHorizontal: spacing.base, gap: spacing.md },
  cardWrap: { flex: 1 },
  cardLeft: { marginRight: spacing.xs },
  cardRight: { marginLeft: spacing.xs },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, textAlign: 'center' },
})
