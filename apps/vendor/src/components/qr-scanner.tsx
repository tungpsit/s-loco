import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { useEffect, useRef, useState } from 'react'
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  error: '#BA1A1A',
}

interface QrScannerProps {
  onScanned: (token: string) => void
  active?: boolean
}

export function QrScanner({ onScanned, active = true }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const lastScanned = useRef<string | null>(null)

  useEffect(() => {
    if (!active) setScanned(false)
  }, [active])

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned || !active) return
    const data = result.data
    if (data === lastScanned.current) return
    lastScanned.current = data
    setScanned(true)
    onScanned(data)
    setTimeout(() => {
      setScanned(false)
      lastScanned.current = null
    }, 3000)
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Đang kiểm tra quyền camera...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>📷</Text>
        <Text style={styles.statusTitle}>Cần quyền truy cập camera</Text>
        <Text style={styles.statusText}>
          S-Loco cần quyền camera để quét mã QR trên voucher của khách.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permissionBtnText}>Cho phép truy cập</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.hint}>Đưa mã QR vào khung hình</Text>
      </View>
    </View>
  )
}

// ─── Scan Result Modal ───────────────────────────────────
interface ScanResultModalProps {
  visible: boolean
  voucher: {
    id: string
    service_name?: string
    customer_name?: string
    final_amount?: number
    status: string
  } | null
  loading?: boolean
  error?: string | null
  onConfirm?: () => void
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Chờ đổi',
  redeemed: 'Đã đổi',
  completed: 'Hoàn thành',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

export function ScanResultModal({
  visible,
  voucher,
  loading,
  error,
  onConfirm,
  onClose,
}: ScanResultModalProps) {
  const fmt = (n?: number) =>
    n != null ? Number(n).toLocaleString('vi-VN') + '₫' : '—'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />

          {loading && (
            <View style={modalStyles.centered}>
              <Text style={modalStyles.loadingText}>Đang xử lý voucher...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={modalStyles.centered}>
              <Text style={modalStyles.errorEmoji}>❌</Text>
              <Text style={modalStyles.errorTitle}>Voucher không hợp lệ</Text>
              <Text style={modalStyles.errorMsg}>{error}</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={modalStyles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && voucher && (
            <>
              <Text style={modalStyles.title}>Thông tin Voucher</Text>

              <View style={modalStyles.fieldRow}>
                <Text style={modalStyles.fieldLabel}>Dịch vụ</Text>
                <Text style={modalStyles.fieldValue}>
                  {voucher.service_name ?? 'Không xác định'}
                </Text>
              </View>

              <View style={modalStyles.fieldRow}>
                <Text style={modalStyles.fieldLabel}>Khách hàng</Text>
                <Text style={modalStyles.fieldValue}>
                  {voucher.customer_name ?? '—'}
                </Text>
              </View>

              <View style={modalStyles.fieldRow}>
                <Text style={modalStyles.fieldLabel}>Giá trị</Text>
                <Text style={[modalStyles.fieldValue, modalStyles.amount]}>
                  {fmt(voucher.final_amount)}
                </Text>
              </View>

              <View style={modalStyles.fieldRow}>
                <Text style={modalStyles.fieldLabel}>Trạng thái</Text>
                <View
                  style={[
                    modalStyles.statusBadge,
                    {
                      backgroundColor:
                        voucher.status === 'paid'
                          ? '#FFF3E0'
                          : voucher.status === 'redeemed'
                          ? '#E8F5E9'
                          : '#ECEFF1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.statusText,
                      {
                        color:
                          voucher.status === 'paid'
                            ? '#E65100'
                            : voucher.status === 'redeemed'
                            ? '#2E7D32'
                            : '#546E7A',
                      },
                    ]}
                  >
                    {STATUS_LABELS[voucher.status] ?? voucher.status}
                  </Text>
                </View>
              </View>

              {voucher.status === 'paid' && (
                <TouchableOpacity
                  style={modalStyles.confirmBtn}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={modalStyles.confirmBtnText}>Xác nhận đổi voucher</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={modalStyles.secondaryBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.secondaryBtnText}>
                  {voucher.status === 'paid' ? 'Hủy' : 'Đóng'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22,27,46,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#B5BED4',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  centered: { alignItems: 'center', paddingVertical: 20 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F8',
  },
  fieldLabel: { fontSize: 14, color: colors.onSurfaceVariant },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  amount: { color: colors.primary, fontSize: 17 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { color: colors.onSurfaceVariant, fontSize: 14 },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 12,
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  loadingText: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center' },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.error, marginBottom: 8 },
  errorMsg: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 8 },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  hint: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  emoji: { fontSize: 56, marginBottom: 16 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  statusText: { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  permissionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 20,
  },
  permissionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
})
