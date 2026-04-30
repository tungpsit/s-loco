/**
 * Home Screen — Klook-inspired tourist marketplace home.
 */
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ServiceCardSkeleton } from '../../components/loading-skeleton'
import ServiceCard from '../../components/service-card'
import { useServices, useWeather } from '../../hooks/useQuery'
import type { ServiceItem } from '../../lib/api'
import { colors, shadows, spacing, typography } from '../../lib/theme'

const CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
]

const OFFERS = [
  {
    id: 'ai',
    title: 'AI beach itinerary',
    subtitle: 'Tạo lịch trình Sầm Sơn trong 30 giây',
    icon: '✨',
    route: '/(tabs)/ai',
  },
  {
    id: 'voucher',
    title: 'Voucher minh bạch',
    subtitle: 'Mua trước, quét QR, dùng ngay',
    icon: '🎫',
    route: '/(tabs)/vouchers',
  },
]

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null)

  const { data, isLoading } = useServices({
    category: category ?? undefined,
    limit: 20,
  })
  const { data: weatherData } = useWeather()

  const items: ServiceItem[] = data?.items ?? []
  const weather = weatherData?.weather

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
      <FlatList
        data={isLoading ? Array(6).fill(null) : items}
        renderItem={isLoading ? () => <ServiceCardSkeleton /> : renderService}
        keyExtractor={(item: ServiceItem | null, index) => item?.id ?? `loading-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.location}>Sầm Sơn, Thanh Hóa</Text>
                  <Text style={styles.heroTitle}>Bạn muốn đi đâu?</Text>
                </View>
                <TouchableOpacity
                  style={styles.weatherBtn}
                  onPress={() => router.push('/content/weather')}
                  accessibilityLabel="Thời tiết"
                >
                  <Text style={styles.weatherText}>
                    {weather?.temperature != null ? `${weather.temperature}°` : '🌤️'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.searchPill}
                onPress={() => router.push('/(tabs)/browse')}
              >
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchText}>Tìm dịch vụ, nhà hàng, khách sạn...</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryPanel}>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.slug}
                    style={styles.categoryItem}
                    onPress={() => setCategory(category === cat.slug ? null : cat.slug)}
                    activeOpacity={0.75}
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
                        styles.categoryName,
                        category === cat.slug && styles.categoryNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ưu đãi nổi bật</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.offerRow}>
                  {OFFERS.map((offer) => (
                    <TouchableOpacity
                      key={offer.id}
                      style={styles.offerCard}
                      onPress={() => router.push(offer.route as never)}
                    >
                      <Text style={styles.offerIcon}>{offer.icon}</Text>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      <Text style={styles.offerSub}>{offer.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionKicker}>CURATED SERVICES</Text>
                <Text style={styles.sectionTitle}>
                  {category
                    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Dịch vụ')
                    : 'Phổ biến gần bạn'}
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
        ListFooterComponent={<View style={{ height: 108 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { paddingBottom: spacing.xl },
  hero: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 76,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  location: { ...typography.labelMd, color: 'rgba(255,255,255,0.78)', marginBottom: 4 },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.white },
  weatherBtn: {
    minWidth: 52,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherText: { color: colors.white, fontWeight: '800' },
  searchPill: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  categoryPanel: {
    marginHorizontal: spacing.base,
    marginTop: -48,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  categoryItem: { width: '33.333%', alignItems: 'center', gap: 7 },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapActive: { backgroundColor: colors.primary },
  categoryIcon: { fontSize: 24 },
  categoryName: { ...typography.labelMd, color: colors.onSurface, maxWidth: 86 },
  categoryNameActive: { color: colors.primary, fontWeight: '800' },
  section: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  sectionKicker: {
    ...typography.labelSm,
    color: colors.coral,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.md },
  seeAll: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  offerRow: { flexDirection: 'row', gap: spacing.md, paddingRight: spacing.base },
  offerCard: {
    width: 230,
    minHeight: 118,
    borderRadius: 18,
    padding: spacing.base,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  offerIcon: { fontSize: 26, marginBottom: spacing.sm },
  offerTitle: { ...typography.titleMd, color: colors.onSurface },
  offerSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 3 },
  row: { paddingHorizontal: spacing.base, gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  cardLeft: { marginRight: spacing.xs },
  cardRight: { marginLeft: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, textAlign: 'center', color: colors.onSurfaceVariant },
})
