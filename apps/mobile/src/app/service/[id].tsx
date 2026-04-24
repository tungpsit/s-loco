/**
 * Service Detail Screen — shows service info and "Mua ngay" CTA that navigates to checkout.
 */
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatVND } from '../../components/service-card'
import { useCreateOrder, useServiceDetail } from '../../hooks/useQuery'
import { borderRadius, colors, shadows, spacing, typography } from '../../lib/theme'

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [quantity, setQuantity] = useState(1)

  const { data, isLoading, error } = useServiceDetail(id ?? '')
  const createOrder = useCreateOrder()

  const service = data?.service

  async function handleBuy() {
    if (!id) return
    try {
      const result = await createOrder.mutateAsync([{ service_id: id, quantity }])
      const orderId = result.order.id
      router.push(`/checkout?orderId=${orderId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      Alert.alert('Lỗi', msg, [{ text: 'OK' }])
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Không tải được dịch vụ.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.retryLink}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const hasDiscount =
    service.discount_price != null && service.discount_price < (service.original_price ?? 0)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageWrap}>
          {service.images?.[0] ? (
            <Image source={{ uri: service.images[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageKicker}>S-Loco</Text>
              <Text style={styles.imagePlaceholderText}>Premium coastal service</Text>
            </View>
          )}
          <View style={styles.imageShade} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -
                {Math.round(
                  (1 - (service.discount_price ?? 0) / (service.original_price ?? 1)) * 100,
                )}
                %
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{service.name}</Text>
          <View style={styles.metaRow}>
            {service.vendor_name && <Text style={styles.vendor}>{service.vendor_name}</Text>}
            {service.rating != null && (
              <Text style={styles.rating}>★ {service.rating.toFixed(1)}</Text>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatVND(service.original_price)}</Text>
            )}
            <Text style={[styles.price, hasDiscount && styles.discountedPrice]}>
              {formatVND(service.discount_price ?? service.original_price)}
            </Text>
          </View>

          {/* Description */}
          {service.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.desc}>{service.description}</Text>
            </View>
          )}

          {/* Duration */}
          {service.duration_minutes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thời lượng</Text>
              <Text style={styles.desc}>{service.duration_minutes} phút</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        {/* Quantity stepper */}
        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Số lượng</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, createOrder.isPending && styles.buyBtnDisabled]}
          onPress={handleBuy}
          disabled={createOrder.isPending}
          activeOpacity={0.75}
        >
          {createOrder.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.buyBtnText}>Mua ngay</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: spacing.sm, paddingLeft: 0 },
  backBtnText: { ...typography.labelLg, color: colors.primary, fontWeight: '600' },
  errorText: { ...typography.bodyMd, color: colors.error },
  retryLink: { ...typography.labelLg, color: colors.primary },
  body: { paddingBottom: spacing.xl },
  imageWrap: { height: 286, position: 'relative', backgroundColor: colors.primary },
  image: { width: '100%', height: '100%' },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 89, 133, 0.12)',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  imageKicker: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  imagePlaceholderText: { ...typography.titleLg, color: colors.white, marginTop: spacing.xs },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  discountText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  info: { padding: spacing.base },
  name: { ...typography.headlineSm, marginBottom: spacing.sm, color: colors.onSurface },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  vendor: {
    ...typography.labelLg,
    color: colors.primary,
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  rating: {
    ...typography.labelLg,
    color: colors.onSecondaryContainer,
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  originalPrice: {
    ...typography.bodyMd,
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  price: { ...typography.headlineSm, color: colors.primary },
  discountedPrice: { color: colors.coral },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.titleSm, marginBottom: spacing.xs },
  desc: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },
  footer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.md,
  },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { ...typography.labelLg, color: colors.onSurface },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: colors.onSurface, fontWeight: '600' },
  qtyValue: { ...typography.titleMd, minWidth: 24, textAlign: 'center' },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.fab,
  },
  buyBtnDisabled: { backgroundColor: colors.outline },
  buyBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
})
