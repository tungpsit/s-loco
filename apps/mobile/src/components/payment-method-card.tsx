/**
 * PaymentMethodCard — selectable card for payment gateway selection.
 */
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { borderRadius, colors, spacing, typography } from '../lib/theme'

export interface PaymentGateway {
  id: 'vnpay' | 'momo' | 'sepay'
  label: string
  icon: string
  subtitle: string
}

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  { id: 'vnpay', label: 'VNPay', icon: '💳', subtitle: 'Thẻ ATM / Internet Banking' },
  { id: 'momo', label: 'MoMo', icon: '🟣', subtitle: 'Ví MoMo' },
  { id: 'sepay', label: 'SePay', icon: '🔵', subtitle: 'QR SePay' },
]

interface Props {
  gateway: PaymentGateway
  selected: boolean
  onSelect: (gateway: PaymentGateway) => void
}

export default function PaymentMethodCard({ gateway, selected, onSelect }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onSelect(gateway)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{gateway.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{gateway.label}</Text>
        <Text style={styles.subtitle}>{gateway.subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.titleSm,
    color: colors.onSurface,
    marginBottom: 2,
  },
  labelSelected: {
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
})
