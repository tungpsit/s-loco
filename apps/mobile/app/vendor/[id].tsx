import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import ServiceCard from '../../src/components/service-card'
import { vendorsApi } from '../../src/lib/api'

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsApi.detail(id!),
    enabled: !!id,
  })

  const vendor = data?.vendor
  const services = data?.services ?? []

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !vendor) {
    return <ErrorState onRetry={() => {}} />
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          {/* Hero Image */}
          <View style={styles.heroWrap}>
            {vendor.image_url ? (
              <Image source={{ uri: vendor.image_url }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroEmoji}>🏪</Text>
              </View>
            )}
            <View style={styles.heroGradient} />
          </View>

          {/* Vendor Info */}
          <View style={styles.info}>
            <Text style={styles.eyebrow}>LOCAL PARTNER</Text>
            <Text style={styles.name}>{vendor.name}</Text>
            {vendor.address && <Text style={styles.address}>📍 {vendor.address}</Text>}
            <View style={styles.ratingRow}>
              {vendor.rating != null && (
                <View style={styles.rating}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
                  {vendor.review_count != null && (
                    <Text style={styles.reviewCount}>({vendor.review_count} đánh giá)</Text>
                  )}
                </View>
              )}
              {vendor.category && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{vendor.category}</Text>
                </View>
              )}
            </View>
            {vendor.description && <Text style={styles.description}>{vendor.description}</Text>}
          </View>

          {/* Services */}
          {services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dịch vụ ({services.length})</Text>
            </View>
          )}
        </>
      }
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ServiceCard item={item} onPress={() => router.push(`/service/${item.id}`)} />
        </View>
      )}
      ListFooterComponent={<View style={{ height: spacing.xl }} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xl },
  heroWrap: {
    height: 260,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 64 },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(244,247,251,0.5)',
  },
  info: {
    padding: spacing.base,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -28,
  },
  eyebrow: { ...typography.labelSm, color: colors.primary, fontWeight: '800', marginBottom: 4 },
  name: { ...typography.headlineMd, fontWeight: '800', marginBottom: spacing.xs },
  address: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 14, color: '#F59E0B' },
  ratingText: { ...typography.titleSm, color: colors.onSurface },
  reviewCount: { ...typography.bodySm, color: colors.outline },
  chip: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipText: { ...typography.labelMd, color: colors.primary },
  description: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },
  section: { padding: spacing.base, paddingBottom: 0 },
  sectionTitle: { ...typography.titleLg },
  cardWrap: { paddingHorizontal: spacing.base, marginTop: spacing.md },
})
