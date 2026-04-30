import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, shadows, spacing, typography } from '../../lib/theme'
import { ServiceCardSkeleton } from '../../src/components/loading-skeleton'
import ServiceCard from '../../src/components/service-card'
import { contentApi, servicesApi } from '../../src/lib/api'

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
    route: '/ai/itinerary',
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', category],
    queryFn: () => servicesApi.list({ category: category ?? undefined, limit: 20 }),
  })

  const { data: articlesData } = useQuery({
    queryKey: ['home-articles'],
    queryFn: () => contentApi.articles({ limit: 3 }),
  })

  const { data: weatherData } = useQuery({
    queryKey: ['home-weather'],
    queryFn: () => contentApi.weather(),
    staleTime: 1000 * 60 * 10,
  })

  const items = data?.items ?? []
  const articles = articlesData?.items ?? []
  const weather = weatherData?.weather

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
      <FlatList
        data={isLoading ? Array(6).fill(null) : items}
        renderItem={isLoading ? () => <ServiceCardSkeleton /> : renderService}
        keyExtractor={(item: any, index) => item?.id ?? `loading-${index}`}
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
                >
                  <Text style={styles.weatherText}>
                    {weather?.temperature != null ? `${weather.temperature}°` : '🌤️'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.searchPill}
                onPress={() => router.push('/(tabs)/search')}
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
                    style={[
                      styles.categoryItem,
                      category === cat.slug && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(category === cat.slug ? null : cat.slug)}
                  >
                    <View style={styles.categoryIconWrap}>
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
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Ưu đãi nổi bật</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.offerRow}>
                  {OFFERS.map((offer) => (
                    <TouchableOpacity
                      key={offer.id}
                      style={styles.offerCard}
                      onPress={() => router.push(offer.route as any)}
                    >
                      <Text style={styles.offerIcon}>{offer.icon}</Text>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      <Text style={styles.offerSub}>{offer.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {articles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Cảm hứng du lịch</Text>
                  <TouchableOpacity onPress={() => router.push('/content/articles')}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.articleRow}>
                    {articles.map((article: any) => {
                      const image = article.image_url ?? article.coverImageUrl
                      return (
                        <TouchableOpacity
                          key={article.id}
                          style={styles.articleCard}
                          onPress={() => router.push(`/content/${article.slug}`)}
                        >
                          {image ? (
                            <Image source={{ uri: image }} style={styles.articleImage} />
                          ) : (
                            <View style={styles.articleImagePlaceholder}>
                              <Text style={styles.articleImageEmoji}>📰</Text>
                            </View>
                          )}
                          <Text style={styles.articleChip}>{article.category ?? 'Guide'}</Text>
                          <Text style={styles.articleTitle} numberOfLines={2}>
                            {article.title}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>
                  {category
                    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Dịch vụ')
                    : 'Phổ biến gần bạn'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>Không tải được dữ liệu. Thử lại sau.</Text>}
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
  location: {
    ...typography.labelMd,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.white,
  },
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  categoryItem: {
    width: '33.333%',
    alignItems: 'center',
    gap: 7,
  },
  categoryItemActive: {
    opacity: 1,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 24 },
  categoryName: {
    ...typography.labelMd,
    color: colors.onSurface,
    maxWidth: 86,
  },
  categoryNameActive: { color: colors.primary, fontWeight: '800' },
  section: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.titleLg },
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
  articleRow: { flexDirection: 'row', gap: spacing.md, paddingRight: spacing.base },
  articleCard: {
    width: 172,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  articleImage: { width: '100%', height: 92, borderRadius: 12 },
  articleImagePlaceholder: {
    width: '100%',
    height: 92,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleImageEmoji: { fontSize: 28, opacity: 0.5 },
  articleChip: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  articleTitle: { ...typography.labelMd, color: colors.onSurface },
  row: { paddingHorizontal: spacing.base, gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  cardLeft: { marginRight: spacing.xs },
  cardRight: { marginLeft: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: { ...typography.bodyMd, textAlign: 'center', color: colors.onSurfaceVariant },
  errorText: { ...typography.bodySm, color: colors.error },
})
