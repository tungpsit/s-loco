import { useState, useCallback } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { QrScanner, ScanResultModal } from '../../src/components/qr-scanner'
import { voucherApi } from '../../src/lib/api'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
}

interface ScannedVoucher {
  id: string
  service_name?: string
  customer_name?: string
  final_amount?: number
  status: string
}

interface VerifiedVoucher {
  voucher_id: string
  code: string
  status: string
  can_redeem: boolean
  expires_at?: string
}

export default function ScanScreen() {
  const [modalVisible, setModalVisible] = useState(false)
  const [scannedVoucher, setScannedVoucher] = useState<ScannedVoucher | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [active, setActive] = useState(true)

  const handleScanned = useCallback(async (token: string) => {
    setLoading(true)
    setScanError(null)
    setScannedVoucher(null)

    try {
      // Step 1: Verify QR token without redeeming (QRSN-04)
      const verifyRes = await voucherApi.verify(token)
      if (!verifyRes.ok || !verifyRes.data?.data?.voucher) {
        const msg = verifyRes.data?.error?.message ?? 'Mã QR không hợp lệ.'
        setScanError(msg)
        return
      }

      const verified = verifyRes.data.data.voucher as VerifiedVoucher

      if (!verified.can_redeem) {
        const statusLabel = verified.status === 'redeemed' ? 'Đã được đổi rồi'
          : verified.status === 'completed' ? 'Đã hoàn thành'
          : verified.status === 'expired' ? 'Đã hết hạn'
          : `Trạng thái: ${verified.status}`
        setScanError(`${statusLabel}. Không thể đổi.`)
        return
      }

      // Step 2: Redeem (QR is valid and status is PAID)
      const redeemRes = await voucherApi.redeem(token)
      if (redeemRes.ok && redeemRes.data?.data?.voucher) {
        const voucher = redeemRes.data.data.voucher as ScannedVoucher
        setScannedVoucher(voucher)
      } else {
        const msg = redeemRes.data?.error?.message ?? 'Không nhận diện được voucher.'
        setScanError(msg)
      }
    } catch {
      setScanError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
      setModalVisible(true)
      setActive(false)
    }
  }, [])

  const handleConfirmRedeem = useCallback(async () => {
    if (!scannedVoucher) return
    setCompleting(true)
    try {
      const res = await voucherApi.complete(scannedVoucher.id)
      if (res.ok && res.data?.data?.voucher) {
        const updated = res.data.data.voucher as ScannedVoucher
        setScannedVoucher(updated)
        Alert.alert('Thành công', 'Voucher đã được xác nhận hoàn thành!', [
          { text: 'OK', onPress: () => closeModal() },
        ])
      } else {
        const msg = res.data?.error?.message ?? 'Không thể xác nhận. Vui lòng thử lại.'
        Alert.alert('Lỗi', msg)
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.')
    } finally {
      setCompleting(false)
    }
  }, [scannedVoucher])

  function closeModal() {
    setModalVisible(false)
    setScannedVoucher(null)
    setScanError(null)
    setActive(true)
  }

  return (
    <View style={styles.container}>
      <QrScanner onScanned={handleScanned} active={active} />

      <ScanResultModal
        visible={modalVisible}
        voucher={scannedVoucher}
        loading={loading}
        error={scanError}
        onConfirm={handleConfirmRedeem}
        onClose={closeModal}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
})
