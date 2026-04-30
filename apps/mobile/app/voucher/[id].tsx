import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import QRDisplay from '../../src/components/qr-display'
import { vouchersApi } from '../../src/lib/api'

const STATUS_LABELS: Record<string, string> = {
  created: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  redeemed: 'Đã đổi',
  completed: 'Hoàn thành',
  refunded: 'Đã hoàn tiền',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['voucher', id],
    queryFn: () => vouchersApi.detail(id!),
    enabled: !!id,
  })

  const voucher = data?.voucher
  const qrData = voucher?.qr_token ?? voucher?.qr_code ?? voucher?.id ?? ''

  const canSelfRedeem = voucher?.status === 'paid'
  const canCancel = voucher?.status === 'created'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>VOUCHER</Text>
        <Text style={styles.title}>Mã sử dụng dịch vụ</Text>
        <Text style={styles.subtitle}>Đưa QR này cho cửa hàng để xác nhận voucher</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 60 }} />
      ) : error || !voucher ? (
        <ErrorState onRetry={() => {}} />
      ) : (
        <>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{STATUS_LABELS[voucher.status] ?? voucher.status}</Text>
          </View>

          {/* QR Code */}
          {qrData && (
            <View style={styles.qrSection}>
              <QRDisplay
                qrData={qrData}
                size={200}
                voucherCode={voucher.id?.slice(0, 8).toUpperCase()}
              />
              <Text style={styles.scanHint}>Xuất trình mã QR này cho nhân viên để đổi voucher</Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dịch vụ</Text>
              <Text style={styles.infoValue}>{voucher.service_name ?? '—'}</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cửa hàng</Text>
              <Text style={styles.infoValue}>{voucher.vendor_name ?? '—'}</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng</Text>
              <Text style={styles.infoValue}>{voucher.quantity ?? 1}</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tổng tiền</Text>
              <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
                {voucher.total_amount ? `${voucher.total_amount.toLocaleString('vi-VN')}₫` : '—'}
              </Text>
            </View>
            {voucher.created_at && (
              <>
                <View style={styles.infoSep} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày mua</Text>
                  <Text style={styles.infoValue}>
                    {new Date(voucher.created_at).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </>
            )}
            {voucher.redeemed_at && (
              <>
                <View style={styles.infoSep} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày đổi</Text>
                  <Text style={styles.infoValue}>
                    {new Date(voucher.redeemed_at).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {canSelfRedeem && (
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => router.push(`/voucher/${id}/scan`)}
              >
                <Text style={styles.scanBtnText}>📷 Tự đổi voucher</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Hủy voucher</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xl },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: 54,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: -24,
  },
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)', fontWeight: '800' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.white, marginTop: 4 },
  subtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  statusBadge: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: spacing.lg,
  },
  statusText: { ...typography.labelLg, color: colors.primary },
  qrSection: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: spacing.xl,
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  scanHint: {
    ...typography.bodySm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
  },
  infoSep: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.base,
  },
  infoLabel: { ...typography.bodyMd, color: colors.outline },
  infoValue: { ...typography.titleSm, color: colors.onSurface },
  actions: { gap: spacing.md, paddingHorizontal: spacing.base },
  scanBtn: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  scanBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  cancelBtn: {
    backgroundColor: 'rgba(186,26,26,0.08)',
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.error, fontWeight: '600', fontSize: 15 },
})
