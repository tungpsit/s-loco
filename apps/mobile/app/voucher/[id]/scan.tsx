import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'
/**
 * Self-Redeem Voucher — scan vendor QR to redeem
 */
import { useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, spacing, typography } from '../../../lib/theme'
import { vouchersApi } from '../../../src/lib/api'

export default function ScanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  // In a real app, the CameraView would scan a QR code and extract the vendor ID
  // For now, we simulate by using a manual entry or camera scan
  async function handleRedeem(scannedVendorId?: string) {
    const vId = scannedVendorId ?? vendorId
    if (!vId) {
      Alert.alert('Lỗi', 'Vui lòng quét mã QR của cửa hàng.')
      return
    }
    setRedeeming(true)
    try {
      await vouchersApi.selfRedeem(id!, vId)
      Alert.alert('Thành công', 'Voucher đã được đổi thành công!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể đổi voucher.')
    } finally {
      setRedeeming(false)
    }
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Cần quyền camera</Text>
          <Text style={styles.permissionText}>
            Để quét mã QR của cửa hàng, vui lòng cho phép S-Loco truy cập camera.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Cho phép camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={(e) => {
          if (scanned) return
          const data = e.data
          if (data) {
            setScanned(true)
            // Extract vendor_id from QR data — format may vary
            // Assuming QR contains vendor_id as string
            setVendorId(data)
            Alert.alert('Đã quét', `Mã cửa hàng: ${data}`, [
              { text: 'Hủy', onPress: () => setScanned(false), style: 'cancel' },
              { text: 'Đổi voucher', onPress: () => handleRedeem(data) },
            ])
          }
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>Đưa mã QR của cửa hàng vào khung để quét</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {redeeming ? (
          <ActivityIndicator color={colors.white} size="large" />
        ) : (
          <TouchableOpacity
            style={styles.redeemBtn}
            onPress={() => handleRedeem()}
            disabled={!vendorId}
          >
            <Text style={styles.redeemBtnText}>Đổi voucher</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: colors.primaryFixed,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  hint: {
    ...typography.bodyMd,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  bottom: {
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    gap: spacing.md,
  },
  redeemBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  redeemBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  skipBtn: { padding: spacing.sm },
  skipBtnText: { color: colors.outline, fontWeight: '500', fontSize: 14 },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  permissionEmoji: { fontSize: 56, marginBottom: spacing.lg },
  permissionTitle: { ...typography.headlineMd, marginBottom: spacing.sm },
  permissionText: {
    ...typography.bodyMd,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  permissionBtnText: { color: colors.white, fontWeight: '600' },
})
