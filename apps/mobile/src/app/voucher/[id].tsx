/**
 * Voucher Detail — voucher status, QR token, and purchase metadata.
 */
import { router, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ErrorState from '../../components/error-state'
import QRDisplay from '../../components/qr-display'
import { useVoucherDetail } from '../../hooks/useQuery'
import { borderRadius, colors, shadows, spacing, typography } from '../../lib/theme'

const STATUS_LABELS: Record<string, string> = {
  created: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  redeemed: 'Đã sử dụng',
  completed: 'Hoàn thành',
  settled: 'Đã quyết toán',
  refunded: 'Đã hoàn tiền',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { data, isLoading, error, refetch } = useVoucherDetail(id ?? '')
  const voucher = data?.voucher

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết voucher</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !voucher ? (
        <ErrorState message="Không tải được voucher." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.passHero}>
            <Text style={styles.passKicker}>S-Loco voucher</Text>
            <Text style={styles.passTitle}>{voucher.service_name ?? 'Voucher'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[voucher.status] ?? voucher.status}
              </Text>
            </View>
          </View>

          {voucher.qr_token ? (
            <View style={styles.qrCard}>
              <QRDisplay
                qrData={voucher.qr_token}
                size={200}
                voucherCode={voucher.id.slice(0, 8).toUpperCase()}
              />
              <Text style={styles.hint}>
                Xuất trình mã QR này cho nhân viên để sử dụng dịch vụ.
              </Text>
            </View>
          ) : (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>QR sẽ khả dụng sau khi thanh toán</Text>
              <Text style={styles.pendingText}>
                Hoàn tất thanh toán để nhận mã sử dụng dịch vụ.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <InfoRow label="Dịch vụ" value={voucher.service_name ?? '—'} />
            <InfoRow label="Cửa hàng" value={voucher.vendor_name ?? '—'} />
            <InfoRow label="Số lượng" value={String(voucher.quantity ?? 1)} />
            <InfoRow
              label="Tổng tiền"
              value={
                voucher.total_amount ? `${voucher.total_amount.toLocaleString('vi-VN')}đ` : '—'
              }
              emphasized
            />
            <InfoRow
              label="Ngày mua"
              value={
                voucher.created_at ? new Date(voucher.created_at).toLocaleDateString('vi-VN') : '—'
              }
              last
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function InfoRow({
  label,
  value,
  emphasized,
  last,
}: {
  label: string
  value: string
  emphasized?: boolean
  last?: boolean
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, emphasized && styles.infoValueEmphasized]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: spacing.sm, paddingLeft: 0 },
  backBtnText: { ...typography.labelLg, color: colors.primary, fontWeight: '600' },
  title: { ...typography.titleMd, color: colors.onSurface },
  headerSpacer: { width: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  passHero: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  passKicker: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  passTitle: { ...typography.headlineSm, color: colors.white, marginBottom: spacing.md },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: borderRadius.full,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
  },
  statusText: { ...typography.labelLg, color: colors.white, fontWeight: '700' },
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  hint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pendingCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  pendingTitle: { ...typography.titleSm, color: colors.onSurface, marginBottom: spacing.xs },
  pendingText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  infoLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant, flexShrink: 0 },
  infoValue: { ...typography.titleSm, color: colors.onSurface, flex: 1, textAlign: 'right' },
  infoValueEmphasized: { color: colors.coral, fontWeight: '700' },
})
