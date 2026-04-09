import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
/**
 * Service Detail Screen — photos carousel, description, price, add-to-order
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import ReviewItemComponent from '../../src/components/review-item'
import { formatVND } from '../../src/components/service-card'
import { servicesApi } from '../../src/lib/api'
import { useOrderStore } from '../../src/stores/order-store'

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { addItem } = useOrderStore()
  const [qty, setQty] = useState(1)
  const [selectedImg, setSelectedImg] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.detail(id!),
    enabled: !!id,
  })

  const service = data?.service
  const hasDiscount =
    service?.discount_price != null && service.discount_price < (service.original_price ?? 0)

  function handleAddToCart() {
    if (!service) return
    addItem(service, qty)
    router.push('/order/checkout')
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !service) {
    return <ErrorState onRetry={() => {}} />
  }

  const images = service.images?.length ? service.images : []

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setSelectedImg(Math.round(e.nativeEvent.contentOffset.x / 340))
              }}
            >
              {images.map((uri: string, i: number) => (
                <Image key={i} source={{ uri }} style={styles.heroImage} />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_: any, i: number) => (
                  <View key={i} style={[styles.dot, i === selectedImg && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>📍</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          {service.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{service.category}</Text>
            </View>
          )}
          <Text style={styles.name}>{service.name}</Text>
          {service.vendor_name && (
            <TouchableOpacity
              onPress={() => (service.vendor_id ? router.push(`/vendor/${service.vendor_id}`) : {})}
            >
              <Text style={styles.vendor}>🏪 {service.vendor_name}</Text>
            </TouchableOpacity>
          )}
          {service.rating != null && (
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
              {service.review_count != null && (
                <Text style={styles.reviewCount}>({service.review_count} đánh giá)</Text>
              )}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <View>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{formatVND(service.original_price)}</Text>
              )}
              <Text style={[styles.price, hasDiscount && styles.discountedPrice]}>
                {formatVND(service.discount_price ?? service.original_price)}
              </Text>
            </View>
            {service.discount_percent != null && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{Math.round(Number(service.discount_percent))}%
                </Text>
              </View>
            )}
          </View>

          {/* Duration */}
          {service.duration_minutes && (
            <View style={styles.durationRow}>
              <Text style={styles.durationIcon}>⏱</Text>
              <Text style={styles.durationText}>{service.duration_minutes} phút</Text>
            </View>
          )}

          {/* Description */}
          {service.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          )}

          {/* Reviews */}
          {service.reviews?.map((r: any) => (
            <View key={r.id} style={styles.section}>
              <ReviewItemComponent review={r} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty((q) => Math.min(10, q + 1))}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>
            Thêm vào đơn ({formatVND((service.discount_price ?? service.original_price ?? 0) * qty)}
            )
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: 340, height: 240 },
  heroPlaceholder: {
    height: 200,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 60, opacity: 0.4 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outlineVariant,
  },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  info: { padding: spacing.base, backgroundColor: colors.surfaceContainerLowest },
  categoryChip: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  categoryText: { ...typography.labelMd, color: colors.primary },
  name: { ...typography.headlineMd, marginBottom: spacing.xs },
  vendor: { ...typography.bodyMd, color: colors.secondary, marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  star: { fontSize: 14, color: '#F59E0B' },
  ratingText: { ...typography.titleSm },
  reviewCount: { ...typography.bodySm, color: colors.outline },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  originalPrice: {
    ...typography.bodyMd,
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  price: { ...typography.headlineMd, color: colors.primary },
  discountedPrice: { color: colors.error },
  discountBadge: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  discountText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  durationIcon: { fontSize: 14 },
  durationText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.sm },
  description: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.md,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  qtyText: { ...typography.titleMd, minWidth: 24, textAlign: 'center' },
  addBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
})
