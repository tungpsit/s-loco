/**
 * My Vouchers — list with status filter tabs.
 */
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ErrorState from '../../components/error-state'
import GiftModal from '../../components/gift-modal'
import { VoucherCardSkeleton } from '../../components/loading-skeleton'
import VoucherCardComponent from '../../components/voucher-card'
import { useVouchers } from '../../hooks/useQuery'
import type { VoucherItem } from '../../lib/api'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'
import { useAuthStore } from '../../stores/auth-store'

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'created', label: 'Chờ thanh toán' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'redeemed', label: 'Đã sử dụng' },
  { key: 'completed', label: 'Hoàn thành' },
]

export default function VouchersScreen() {
  const { isLoggedIn } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [giftVoucher, setGiftVoucher] = useState<VoucherItem | null>(null)

  const statusParam = activeTab === 'all' ? undefined : activeTab

  const { data, isLoading, error, refetch } = useVouchers(
    {
      status: statusParam,
    },
    { enabled: isLoggedIn },
  )

  const items: VoucherItem[] = data?.items ?? []

  const renderItem = useCallback(
    ({ item }: { item: VoucherItem }) => (
      <View style={styles.cardWrap}>
        <VoucherCardComponent item={item} onPress={() => router.push(`/voucher/${item.id}`)} />
        {item.status === 'paid' && (
          <Pressable style={styles.giftBtn} onPress={() => setGiftVoucher(item)}>
            <Text style={styles.giftBtnText}>Tặng voucher</Text>
          </Pressable>
        )}
      </View>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MY PASSES</Text>
        <Text style={styles.title}>Voucher của tôi</Text>
        <Text style={styles.subtitle}>Xuất trình QR khi sử dụng dịch vụ</Text>
      </View>

      {isLoggedIn && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      {!isLoggedIn ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>SL</Text>
          <Text style={styles.emptyTitle}>Đăng nhập để xem voucher</Text>
          <Text style={styles.emptyText}>
            Bạn vẫn có thể khám phá dịch vụ trước, tài khoản chỉ cần khi đặt đơn và nhận voucher.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() =>
              router.push({
                pathname: '/(auth)/login',
                params: { redirectTo: '/(tabs)/vouchers' },
              })
            }
          >
            <Text style={styles.emptyBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/browse')}>
            <Text style={styles.browseBtnText}>Tiếp tục khám phá</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>SL</Text>
                <Text style={styles.emptyTitle}>Chưa có voucher</Text>
                <Text style={styles.emptyText}>
                  Mua dịch vụ để nhận voucher và xuất trình QR khi sử dụng.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/browse')}
                >
                  <Text style={styles.emptyBtnText}>Khám phá dịch vụ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ padding: spacing.base, gap: spacing.md }}>
                {[1, 2, 3].map((i) => (
                  <VoucherCardSkeleton key={i} />
                ))}
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {giftVoucher && (
        <GiftModal
          voucher={giftVoucher}
          visible
          onClose={() => setGiftVoucher(null)}
          onSuccess={refetch}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: {
    ...typography.labelSm,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.white, marginTop: 4 },
  subtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  tabs: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginTop: -18,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: { paddingBottom: spacing.xl },
  cardWrap: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  giftBtn: {
    marginTop: -spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    alignSelf: 'flex-end',
  },
  giftBtnText: {
    ...typography.labelMd,
    color: colors.coral,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    ...typography.headlineMd,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: '800',
  },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: {
    ...typography.bodyMd,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  browseBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  browseBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
})
