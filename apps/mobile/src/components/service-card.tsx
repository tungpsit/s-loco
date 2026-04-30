import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { borderRadius, colors, shadows, spacing, typography } from '../../lib/theme'
import type { ServiceItem } from '../lib/api'

interface Props {
  item: ServiceItem
  onPress?: () => void
}

export function formatVND(amount?: number): string {
  if (amount == null) return 'Liên hệ'
  return `${amount.toLocaleString('vi-VN')}₫`
}

export default function ServiceCard({ item, onPress }: Props) {
  const hasDiscount =
    item.discount_price != null && item.discount_price < (item.original_price ?? 0)
  const discountPct = item.discount_percent
    ? Math.round(Number(item.discount_percent))
    : item.original_price && item.discount_price
      ? Math.round((1 - item.discount_price / item.original_price) * 100)
      : 0

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.imageWrap}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageKicker}>S-Loco</Text>
            <Text style={styles.imagePlaceholderText}>Coastal experience</Text>
          </View>
        )}
        <View style={styles.imageShade} />
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.vendor_name && (
          <Text style={styles.vendor} numberOfLines={1}>
            {item.vendor_name}
          </Text>
        )}
        <View style={styles.footer}>
          <View>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatVND(item.original_price)}</Text>
            )}
            <Text style={[styles.price, hasDiscount && styles.discountedPrice]}>
              {formatVND(item.discount_price ?? item.original_price)}
            </Text>
          </View>
          {item.rating != null && (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  imageWrap: {
    position: 'relative',
    height: 132,
    backgroundColor: colors.primaryContainer,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 109, 204, 0.08)',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  imageKicker: {
    ...typography.labelSm,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  imagePlaceholderText: {
    ...typography.titleSm,
    color: colors.white,
    marginTop: 2,
  },
  categoryBadge: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  categoryText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  name: {
    ...typography.titleSm,
    lineHeight: 20,
    marginBottom: 4,
  },
  vendor: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  originalPrice: {
    ...typography.bodySm,
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  price: {
    ...typography.titleSm,
    color: colors.primary,
  },
  discountedPrice: {
    color: colors.coral,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.sand,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingStar: {
    fontSize: 12,
    color: '#F59E0B',
  },
  ratingText: {
    ...typography.bodySm,
    fontWeight: '600',
  },
})
