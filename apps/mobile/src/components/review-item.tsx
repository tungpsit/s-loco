import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import type { ReviewItem } from '../lib/api'

interface Props {
  review: ReviewItem
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={[styles.star, n <= rating ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      ))}
    </View>
  )
}

export default function ReviewItemComponent({ review }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(review.user_name ?? '?')[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.userName}>{review.user_name ?? 'Khách'}</Text>
          <StarRow rating={review.rating} />
        </View>
        {review.created_at && (
          <Text style={styles.date}>{new Date(review.created_at).toLocaleDateString('vi-VN')}</Text>
        )}
      </View>
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.titleMd,
    color: colors.primary,
  },
  meta: {
    flex: 1,
  },
  userName: {
    ...typography.titleSm,
    marginBottom: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: colors.outlineVariant,
  },
  date: {
    ...typography.bodySm,
    color: colors.outline,
  },
  comment: {
    ...typography.bodyMd,
    marginTop: spacing.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
})
