import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'

interface Props {
  label: string
  icon?: string
  active?: boolean
  onPress?: () => void
}

export default function CategoryChip({ label, icon, active, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  labelActive: {
    color: colors.white,
    fontWeight: '700',
  },
})
