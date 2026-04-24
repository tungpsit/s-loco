import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ErrorState } from '../../src/components/error-state'
import { OrderCard } from '../../src/components/order-card'
import type { Voucher } from '../../src/lib/api'
import { voucherApi } from '../../src/lib/api'
import { useResponsiveLayout } from '../../src/lib/responsive'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EDF1F8',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
}

const FILTER_TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'paid', label: 'Chờ đổi' },
  { key: 'redeemed', label: 'Đã đổi' },
  { key: 'completed', label: 'Hoàn thành' },
]

const STATUS_LIST_MAP: Record<string, string[]> = {
  paid: ['paid'],
  redeemed: ['redeemed'],
  completed: ['completed', 'settled'],
}

export default function OrdersScreen() {
  const [filter, setFilter] = useState('')
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isDesktop, pageMaxWidth, pagePadding } = useResponsiveLayout()

  const load = useCallback(
    async (reset = false, nextPage?: number) => {
      const pg = reset ? 1 : (nextPage ?? 1)
      try {
        const statusList = filter ? STATUS_LIST_MAP[filter] : undefined
        const statuses = statusList?.join(',')
        const res = await voucherApi.list({
          status: statuses,
          page: pg,
          limit: 20,
        })
        if (res.ok && res.data?.data) {
          const items: Voucher[] = res.data.data?.items ?? res.data.data?.data ?? []
          setVouchers(reset ? items : (prev) => [...prev, ...items])
          setHasMore(items.length === 20)
          setError(false)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filter],
  )

  useEffect(() => {
    setLoading(true)
    setPage(1)
    load(true)
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setPage(1)
    load(true)
  }, [load])

  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    load(false, nextPage)
  }, [hasMore, loading, load, page])

  const renderItem = useCallback(
    ({ item }: { item: Voucher }) => (
      <View style={isDesktop && styles.orderCell}>
        <OrderCard voucher={item} onPress={() => router.push(`/voucher/${item.id}`)} />
      </View>
    ),
    [isDesktop],
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.contentShell,
          { paddingHorizontal: pagePadding, maxWidth: pageMaxWidth },
          isDesktop && styles.contentShellDesktop,
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Đơn hàng</Text>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal={!isDesktop}
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={[styles.filterContent, isDesktop && styles.filterContentDesktop]}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading && vouchers.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ flex: 1, paddingVertical: 60 }}
        />
      ) : error && vouchers.length === 0 ? (
        <ErrorState onRetry={() => load(true)} />
      ) : vouchers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>Không có đơn hàng</Text>
        </View>
      ) : (
        <FlatList
          key={isDesktop ? 'desktop-orders' : 'mobile-orders'}
          data={vouchers}
          numColumns={isDesktop ? 2 : 1}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={isDesktop ? styles.desktopColumnWrapper : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: pagePadding, maxWidth: pageMaxWidth },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && vouchers.length > 0 ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  contentShell: {
    alignSelf: 'center',
    width: '100%',
  },
  contentShellDesktop: {
    paddingTop: 24,
  },
  header: { paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  filterScroll: { maxHeight: 44, marginBottom: 12 },
  filterContent: { gap: 8, flexDirection: 'row' },
  filterContentDesktop: { flexWrap: 'wrap' },
  filterTab: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant },
  filterTabTextActive: { color: '#FFFFFF' },
  listContent: { alignSelf: 'center', width: '100%', paddingBottom: 24 },
  desktopColumnWrapper: { gap: 14 },
  orderCell: { flex: 1 },
  emptyCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.onSurfaceVariant },
})
