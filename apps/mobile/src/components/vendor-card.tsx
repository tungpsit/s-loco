import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import type { VendorCard } from '../lib/api'

interface Props {
  item: VendorCard
  onPress?: () => void
}

export default function VendorCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.imageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.emoji}>🏪</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.address && (
          <Text style={styles.address} numberOfLines={1}>
            📍 {item.address}
          </Text>
        )}
        <View style={styles.footer}>
          {item.rating != null && (
            <View style={styles.rating}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              {item.review_count != null && (
                <Text style={styles.reviewCount}>({item.review_count})</Text>
              )}
            </View>
          )}
          {item.category && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.category}</Text>
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
    height: 120,
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
  emoji: {
    fontSize: 36,
    opacity: 0.5,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.titleMd,
    marginBottom: 4,
  },
  address: {
    ...typography.bodySm,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    fontSize: 13,
    color: '#F59E0B',
  },
  ratingText: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  reviewCount: {
    ...typography.bodySm,
  },
  chip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  chipText: {
    color: colors.onSecondaryContainer,
    fontSize: 11,
    fontWeight: '500',
  },
})
