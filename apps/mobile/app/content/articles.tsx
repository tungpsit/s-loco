import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
/**
 * Articles List Screen
 */
import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import { contentApi } from '../../src/lib/api'

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'news', label: 'Tin tức' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'guide', label: 'Hướng dẫn' },
]

export default function ArticlesScreen() {
  const [category, setCategory] = React.useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', category],
    queryFn: () => contentApi.articles({ category: category ?? undefined }),
  })

  const items = data?.items ?? []

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/content/${item.slug}`)}
        activeOpacity={0.75}
      >
        {item.image_url && <Image source={{ uri: item.image_url }} style={styles.cardImage} />}
        <View style={styles.cardContent}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.category ?? 'Bài viết'}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.excerpt && (
            <Text style={styles.cardExcerpt} numberOfLines={2}>
              {item.excerpt}
            </Text>
          )}
          {item.published_at && (
            <Text style={styles.cardDate}>
              {new Date(item.published_at).toLocaleDateString('vi-VN')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài viết</Text>
      </View>

      {/* Category tabs */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[
              styles.tab,
              category === (tab.key === 'all' ? null : tab.key) && styles.tabActive,
            ]}
            onPress={() => setCategory(tab.key === 'all' ? null : tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                category === (tab.key === 'all' ? null : tab.key) && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {error ? (
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
                <Text style={styles.emptyEmoji}>📰</Text>
                <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
              </View>
            ) : (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ paddingVertical: 60 }}
              />
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
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.headlineMd },
  tabs: { paddingHorizontal: spacing.base, gap: spacing.sm, paddingVertical: spacing.sm },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainer,
  },
  tabActive: { backgroundColor: colors.primaryContainer },
  tabText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  list: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: { width: '100%', height: 160 },
  cardContent: { padding: spacing.base },
  chip: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  chipText: { ...typography.labelSm, color: colors.primary },
  cardTitle: { ...typography.titleMd, marginBottom: spacing.xs },
  cardExcerpt: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  cardDate: { ...typography.labelSm, color: colors.outline },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.titleMd },
})
