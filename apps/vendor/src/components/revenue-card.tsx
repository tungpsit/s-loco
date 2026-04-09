import { StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  surfaceContainerLowest: '#FFFFFF',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

interface RevenueCardProps {
  label: string
  value: string
  icon: string
  accentColor?: string
  subtitle?: string
}

export function RevenueCard({
  label,
  value,
  icon,
  accentColor = colors.primary,
  subtitle,
}: RevenueCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: colors.primaryFixed }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
})
