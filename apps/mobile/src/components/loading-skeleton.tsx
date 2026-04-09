/**
 * LoadingSkeleton — animated placeholder while data loads
 */
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'

interface Props {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: object
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width: width as number | undefined,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
          opacity,
        },
        style,
      ]}
    />
  )
}

export function ServiceCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock height={140} borderRadius={16} style={{ borderRadius: 16 }} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <SkeletonBlock width="80%" height={16} />
        <SkeletonBlock width="60%" height={12} />
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}
        >
          <SkeletonBlock width="30%" height={18} />
          <SkeletonBlock width="25%" height={20} borderRadius={9999} />
        </View>
      </View>
    </View>
  )
}

export function VoucherCardSkeleton() {
  return (
    <View style={styles.voucherCard}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <SkeletonBlock width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <SkeletonBlock width="60%" height={14} />
          <SkeletonBlock width="40%" height={12} />
        </View>
        <SkeletonBlock width={70} height={20} borderRadius={9999} />
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.base }}
      >
        <SkeletonBlock width="25%" height={16} />
        <SkeletonBlock width="20%" height={12} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: spacing.base,
  },
  voucherCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
    marginHorizontal: spacing.base,
  },
})
