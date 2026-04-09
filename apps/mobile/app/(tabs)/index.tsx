import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
/**
 * Home Screen — Trang chủ: categories grid, featured services, banners
 */
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
import { colors, spacing, typography } from '../../lib/theme'
import CategoryChip from '../../src/components/category-chip'
import { ServiceCardSkeleton } from '../../src/components/loading-skeleton'
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

const BANNERS = [
  {
    id: '1',
    title: 'Tết Sầm Sơn 2026',
    subtitle: 'Ưu đãi lên đến 30%',
    emoji: '🎆',
    color: colors.primaryContainer,
  },
  {
    id: '2',
    title: 'Khám phá ẩm thực',
    subtitle: 'Top 10 nhà hàng ngon',
    emoji: '🍽️',
    color: '#FEF3C7',
  },
]

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['services', category],
    queryFn: () => servicesApi.list({ category: category ?? undefined, limit: 20 }),
  })

  const items = data?.items ?? []

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
      {/* Floating header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào! 👋</Text>
          <Text style={styles.headerTitle}>S-Loco</Text>
        </View>
        <TouchableOpacity style={styles.weatherBtn} onPress={() => router.push('/content/weather')}>
          <Text style={styles.weatherIcon}>🌤️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={isLoading ? Array(4).fill(null) : items}
        renderItem={isLoading ? () => <ServiceCardSkeleton /> : renderService}
        keyExtractor={(item: any) => item?.id ?? Math.random().toString()}
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
                  style={[styles.banner, { backgroundColor: b.color }]}
                  onPress={() => router.push('/ai/itinerary')}
                >
                  <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                  <View>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerSub}>{b.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chips}>
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
            </View>

            {/* Services heading */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>
                  {category
                    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Dịch vụ')
                    : 'Dành cho bạn'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.seeAll}>Xem tất cả →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏖️</Text>
              <Text style={styles.emptyTitle}>Chưa có dịch vụ</Text>
              <Text style={styles.emptyText}>Dịch vụ sẽ hiển thị khi vendor đăng ký.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={isLoading ? null : <View style={{ height: 100 }} />}
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
    backgroundColor: 'rgba(244,247,251,0.85)',
    top: 0,
    zIndex: 10,
  } as ViewStyle,
  greeting: { ...typography.bodySm, color: colors.onSurfaceVariant },
  headerTitle: { ...typography.headlineMd, fontSize: 22 },
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  heroSub: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.7)',
  },
  banners: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  banner: {
    width: 200,
    borderRadius: 16,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerEmoji: { fontSize: 32 },
  bannerTitle: { ...typography.titleSm, fontWeight: '600' },
  bannerSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  section: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.md },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  seeAll: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
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
