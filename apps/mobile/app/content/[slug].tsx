import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import { contentApi } from '../../src/lib/api'

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => contentApi.article(slug!),
    enabled: !!slug,
  })

  const article = data?.article

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !article) {
    return <ErrorState onRetry={() => {}} />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {article.image_url && <Image source={{ uri: article.image_url }} style={styles.hero} />}
      <View style={styles.info}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{article.category ?? 'Bài viết'}</Text>
        </View>
        <Text style={styles.title}>{article.title}</Text>
        {article.author && (
          <Text style={styles.meta}>
            {article.author} ·{' '}
            {article.published_at
              ? new Date(article.published_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </Text>
        )}
        {article.content ? (
          <Text style={styles.body}>{article.content}</Text>
        ) : (
          <Text style={styles.body}>{article.excerpt}</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xl },
  hero: { width: '100%', height: 220 },
  info: { padding: spacing.base },
  chip: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  chipText: { ...typography.labelMd, color: colors.primary },
  title: { ...typography.headlineMd, marginBottom: spacing.sm },
  meta: { ...typography.bodySm, color: colors.outline, marginBottom: spacing.lg },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 24 },
})
