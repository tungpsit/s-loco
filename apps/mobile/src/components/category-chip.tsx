import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { colors, spacing } from '../../lib/theme'

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
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primaryContainer,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSecondaryContainer,
  },
  labelActive: {
    color: colors.white,
  },
})
