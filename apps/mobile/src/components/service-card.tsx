import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
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
      {/* Image */}
      <View style={styles.imageWrap}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>📍</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 36,
    opacity: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.titleMd,
    marginBottom: 4,
  },
  vendor: {
    ...typography.bodySm,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  originalPrice: {
    ...typography.bodySm,
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  price: {
    ...typography.titleMd,
    color: colors.primary,
  },
  discountedPrice: {
    color: colors.error,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
