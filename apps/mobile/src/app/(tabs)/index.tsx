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
import { borderRadius, colors, glass, shadows, spacing, typography } from '../../lib/theme'

const CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: 'Taste' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: 'Stay' },
  { slug: 'spa-massage', name: 'Spa', icon: 'Spa' },
  { slug: 'xe-dien', name: 'Xe điện', icon: 'Ride' },
  { slug: 'giai-tri', name: 'Giải trí', icon: 'Play' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: 'Shop' },
]

const BANNERS = [
  {
    id: '1',
    title: 'Sunset dining pass',
    subtitle: 'Bữa tối ven biển với ưu đãi chọn lọc',
    tag: 'Curated',
    bg: colors.primary,
  },
  {
    id: '2',
    title: 'AI beach itinerary',
    subtitle: 'Lịch trình nghỉ dưỡng trong 30 giây',
    tag: 'Planner',
    bg: colors.coral,
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
          <Text style={styles.weatherIcon}>24°</Text>
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
            <View style={styles.hero}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroTagline}>Sam Son coastal pass</Text>
                  <Text style={styles.heroTitle}>Plan less. Enjoy more.</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Premium</Text>
                </View>
              </View>
              <Text style={styles.heroSub}>
                Voucher minh bạch cho ẩm thực, lưu trú và trải nghiệm địa phương.
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>6</Text>
                  <Text style={styles.heroStatLabel}>Danh mục</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>AI</Text>
                  <Text style={styles.heroStatLabel}>Lịch trình</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>QR</Text>
                  <Text style={styles.heroStatLabel}>Voucher</Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.banners}
            >
              {BANNERS.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.banner, { backgroundColor: b.bg }]}
                  onPress={() => router.push('/(tabs)/ai')}
                  activeOpacity={0.8}
                >
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{b.tag}</Text>
                  </View>
                  <View style={styles.bannerCopy}>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerSub}>{b.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>Discover by mood</Text>
              <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
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

            <View style={styles.sectionHeadRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Curated services</Text>
                <Text style={styles.sectionTitle}>
                  {category
                    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Dịch vụ')
                    : 'Dành cho bạn'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
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
  headerTitle: { ...typography.headlineMd, color: colors.primary },
  weatherBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  weatherIcon: { ...typography.labelMd, color: colors.primary, fontWeight: '800' },
  list: { paddingBottom: spacing.xl },
  hero: {
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTagline: {
    ...typography.labelMd,
    color: colors.primaryFixed,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '700',
    color: colors.white,
    maxWidth: 250,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: { ...typography.labelSm, color: colors.white, fontWeight: '700' },
  heroSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.78)', marginBottom: spacing.lg },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  heroStat: { flex: 1 },
  heroStatValue: { ...typography.titleMd, color: colors.white, fontWeight: '800' },
  heroStatLabel: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)' },
  banners: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  banner: {
    width: 244,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bannerTagText: { ...typography.labelSm, color: colors.white, fontWeight: '700' },
  bannerCopy: { gap: 4 },
  bannerTitle: { ...typography.titleMd, fontWeight: '700', color: colors.white },
  bannerSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.78)' },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  sectionEyebrow: {
    ...typography.labelSm,
    color: colors.coral,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.md, color: colors.onSurface },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  seeAll: { ...typography.bodySm, color: colors.primary, fontWeight: '800' },
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
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  categoryItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  categoryIcon: { ...typography.labelSm, color: colors.primary, fontWeight: '800' },
  categoryLabel: {
    ...typography.labelMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.white,
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
