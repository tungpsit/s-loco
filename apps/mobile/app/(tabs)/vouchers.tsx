import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
/**
 * My Vouchers — list with status filter tabs
 */
import { useCallback, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import { VoucherCardSkeleton } from '../../src/components/loading-skeleton'
import VoucherCardComponent from '../../src/components/voucher-card'
import { vouchersApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'

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

  const statusParam = activeTab === 'all' ? undefined : activeTab

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vouchers', statusParam],
    queryFn: () => vouchersApi.list({ status: statusParam }),
    enabled: isLoggedIn,
  })

  const items = data?.items ?? []

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.cardWrap}>
        <VoucherCardComponent item={item} onPress={() => router.push(`/voucher/${item.id}`)} />
      </View>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.emptyEmoji}>🎫</Text>
          <Text style={styles.emptyTitle}>Đăng nhập để xem voucher</Text>
          <Text style={styles.emptyText}>
            Bạn vẫn có thể khám phá dịch vụ trước, tài khoản chỉ cần khi đặt đơn và nhận voucher.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() =>
              router.push({ pathname: '/auth/otp', params: { redirectTo: '/(tabs)/vouchers' } })
            }
          >
            <Text style={styles.emptyBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.browseBtnText}>Tiếp tục khám phá</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎫</Text>
                <Text style={styles.emptyTitle}>Chưa có voucher</Text>
                <Text style={styles.emptyText}>
                  Mua dịch vụ để nhận voucher và xuất trình QR khi sử dụng.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/search')}
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
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)', fontWeight: '800' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.white, marginTop: 4 },
  subtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  tabs: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginTop: -18,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: { paddingBottom: spacing.xl },
  cardWrap: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  emptyText: {
    ...typography.bodyMd,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 48,
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
