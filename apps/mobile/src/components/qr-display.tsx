/**
 * QRDisplay — displays a voucher QR code using react-native-svg-qrcode-svg
 */
import type React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'

interface Props {
  qrData: string
  size?: number
  voucherCode?: string
}

export default function QRDisplay({ qrData, size = 200, voucherCode }: Props) {
  let QRComponent: React.ReactElement | null = null

  try {
    // Lazy require to avoid crash if module not available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRSvg = require('react-native-qrcode-svg')
    QRComponent = (
      <QRSvg.default value={qrData} size={size} backgroundColor="white" color={colors.onSurface} />
    )
  } catch {
    QRComponent = (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>QR không khả dụng</Text>
        <Text style={styles.fallbackCode} numberOfLines={1}>
          {qrData.slice(0, 32)}...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      {QRComponent}
      {voucherCode && <Text style={styles.code}>{voucherCode}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  code: {
    ...typography.bodySm,
    color: colors.outline,
    letterSpacing: 2,
  },
  fallback: {
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fallbackText: {
    ...typography.bodyMd,
    color: colors.outline,
  },
  fallbackCode: {
    ...typography.labelSm,
    color: colors.outline,
    marginTop: 4,
  },
})
