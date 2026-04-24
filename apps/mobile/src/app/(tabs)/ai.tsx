/**
 * AI Itinerary Screen — Lịch trình AI cho tourist.
 * Phase 6: Wire to POST /itinerary/generate + /itinerary/save.
 */
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { itineraryApi } from '../../lib/api'
import { borderRadius, colors, shadows, spacing, typography } from '../../lib/theme'

const DAYS_OPTIONS = [
  { value: 1, label: '1 ngày' },
  { value: 2, label: '2 ngày' },
  { value: 3, label: '3 ngày' },
  { value: 5, label: '5 ngày' },
]

const BUDGET_OPTIONS = [
  { value: 500000, label: '≤ 500K' },
  { value: 1000000, label: '≤ 1M' },
  { value: 2000000, label: '≤ 2M' },
  { value: 0, label: 'Không giới hạn' },
]

const TYPE_OPTIONS = [
  { value: 'relax', label: 'Nghỉ dưỡng' },
  { value: 'adventure', label: 'Khám phá' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'family', label: 'Gia đình' },
]

interface Activity {
  time: string
  title: string
  description?: string
  service_id?: string | null
  estimated_cost?: number
  category?: string
}

interface DayPlan {
  day: number
  date?: string
  activities: Activity[]
}

interface ItineraryResult {
  title?: string
  summary?: string
  days: DayPlan[]
  total_estimated_cost?: number
  tips?: string[]
}

function formatCost(amount: number | undefined): string {
  if (!amount) return ''
  return amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : String(amount)
}

function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => activity.service_id && setExpanded(!expanded)}
      activeOpacity={activity.service_id ? 0.7 : 1}
    >
      <View style={styles.activityHeader}>
        <View style={styles.activityTimeWrap}>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          {activity.estimated_cost ? (
            <Text style={styles.activityCost}>~{formatCost(activity.estimated_cost)}đ</Text>
          ) : null}
          {activity.category ? (
            <Text style={styles.activityCategory}>{activity.category}</Text>
          ) : null}
        </View>
        {activity.service_id && (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/service/${activity.service_id}`)}
            activeOpacity={0.75}
          >
            <Text style={styles.bookBtnText}>Đặt</Text>
          </TouchableOpacity>
        )}
      </View>
      {expanded && activity.description && (
        <Text style={styles.activityDesc}>{activity.description}</Text>
      )}
    </TouchableOpacity>
  )
}

function ItineraryResultView({
  itinerary,
  onSave,
  onShare,
  saving,
}: {
  itinerary: ItineraryResult
  onSave: () => void
  onShare: () => void
  saving: boolean
}) {
  const totalCost = itinerary.total_estimated_cost
    ? itinerary.total_estimated_cost.toLocaleString('vi-VN')
    : null

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.results}>
      {/* Header */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{itinerary.title ?? 'Lịch trình S-Loco'}</Text>
        {itinerary.summary && <Text style={styles.resultSummary}>{itinerary.summary}</Text>}
        {totalCost && (
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>Tổng ước tính: {totalCost}đ</Text>
          </View>
        )}
      </View>

      {/* Days */}
      {itinerary.days.map((day) => (
        <View key={day.day} style={styles.daySection}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayNumber}>Ngày {day.day}</Text>
            {day.date && <Text style={styles.dayDate}>{day.date}</Text>}
          </View>
          {day.activities.map((activity) => (
            <ActivityCard
              key={`${day.day}-${activity.time}-${activity.title}`}
              activity={activity}
            />
          ))}
        </View>
      ))}

      {/* Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Mẹo hữu ích</Text>
          {itinerary.tips.map((tip) => (
            <View key={tip} style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Save / Share */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.75}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Lưu lịch trình</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, saving && styles.shareBtnDisabled]}
          onPress={onShare}
          disabled={saving}
          activeOpacity={0.75}
        >
          <Text style={styles.shareBtnText}>🔗 Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaPrimary}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.75}
      >
        <Text style={styles.ctaPrimaryText}>Khám phá dịch vụ ngay</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default function AiScreen() {
  const [days, setDays] = useState(2)
  const [budget, setBudget] = useState(0)
  const [type, setType] = useState('relax')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null)
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const PREFERENCE_MAP: Record<string, string[]> = {
    relax: ['nghỉ dưỡng', 'biển', 'spa'],
    adventure: ['khám phá', 'phiêu lưu', 'thể thao'],
    food: ['ẩm thực', 'hải sản', 'nhà hàng'],
    family: ['gia đình', 'trẻ em', 'an toàn'],
  }

  async function handleGenerate() {
    setError(null)
    setSavedToken(null)
    setLoading(true)
    try {
      const result = await itineraryApi.generate({
        days,
        budget,
        preferences: PREFERENCE_MAP[type] ?? [type],
        group_type: type,
      })
      setItinerary(result.itinerary)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      setError(msg)
      Alert.alert('Lỗi', msg, [{ text: 'OK' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!itinerary) return
    setSaving(true)
    try {
      const result = await itineraryApi.save(itinerary)
      setSavedToken(result.share_token)
      Alert.alert('Đã lưu!', `Token: ${result.share_token}`, [
        { text: 'OK' },
        {
          text: 'Sao chép link',
          onPress: () => {
            void Clipboard.setStringAsync(`sloco://itinerary/${result.share_token}`)
          },
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      Alert.alert('Lỗi', msg, [{ text: 'OK' }])
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!savedToken) {
      // Save first if no token yet
      if (!itinerary) return
      setSaving(true)
      try {
        const result = await itineraryApi.save(itinerary)
        setSavedToken(result.share_token)
        await Clipboard.setStringAsync(`sloco://itinerary/${result.share_token}`)
        Alert.alert('Đã sao chép!', 'Link chia sẻ đã được sao chép vào bộ nhớ tạm.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
        Alert.alert('Lỗi', msg, [{ text: 'OK' }])
      } finally {
        setSaving(false)
      }
      return
    }
    await Clipboard.setStringAsync(`sloco://itinerary/${savedToken}`)
    Alert.alert('Đã sao chép!', 'Link chia sẻ đã được sao chép vào bộ nhớ tạm.')
  }

  function reset() {
    setItinerary(null)
    setError(null)
    setSavedToken(null)
  }

  if (itinerary) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={reset} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Tạo mới</Text>
          </TouchableOpacity>
        </View>
        <ItineraryResultView
          itinerary={itinerary}
          onSave={handleSave}
          onShare={handleShare}
          saving={saving}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Trip studio</Text>
          <Text style={styles.title}>Lịch trình AI</Text>
          <Text style={styles.subtitle}>
            Để AI tạo lịch trình du lịch hoàn hảo cho bạn tại Sầm Sơn
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Sam Son in one plan</Text>
          <Text style={styles.heroTitle}>Lập lịch trình thông minh</Text>
          <Text style={styles.heroSub}>
            Chỉ cần chọn vài tùy chọn, AI sẽ gợi ý lịch trình tối ưu
          </Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số ngày</Text>
          <View style={styles.chips}>
            {DAYS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, days === opt.value && styles.chipActive]}
                onPress={() => setDays(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, days === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngân sách</Text>
          <View style={styles.chips}>
            {BUDGET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, budget === opt.value && styles.chipActive]}
                onPress={() => setBudget(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, budget === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phong cách</Text>
          <View style={styles.chips}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, type === opt.value && styles.chipActive]}
                onPress={() => setType(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, type === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.75}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.ctaText}>Đang tạo lịch trình...</Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>Tạo lịch trình ✨</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          * Lịch trình AI sử dụng Gemini API — gợi ý dịch vụ có sẵn trên S-Loco
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing['2xl'] },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.labelSm,
    color: colors.coral,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { ...typography.headlineMd, color: colors.primary },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  hero: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  heroEyebrow: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.titleLg,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.75)',
  },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleMd,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  cta: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.fab,
  },
  ctaDisabled: {
    backgroundColor: colors.outline,
  },
  ctaPrimary: {
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.fab,
  },
  ctaPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
  },
  note: {
    ...typography.bodySm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  // Result styles
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: spacing.sm,
    paddingLeft: 0,
  },
  backBtnText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
  },
  results: { paddingBottom: spacing['2xl'] },
  resultHeader: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  resultTitle: {
    ...typography.headlineMd,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  resultSummary: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.md,
  },
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  costBadgeText: {
    ...typography.labelMd,
    color: colors.white,
  },
  daySection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dayNumber: {
    ...typography.titleLg,
    color: colors.primary,
  },
  dayDate: {
    ...typography.bodySm,
    color: colors.outline,
  },
  activityCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityTimeWrap: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  activityTime: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  activityContent: { flex: 1 },
  activityTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
  },
  activityCost: {
    ...typography.bodySm,
    color: colors.primary,
    marginTop: 2,
  },
  activityCategory: {
    ...typography.labelSm,
    color: colors.outline,
    marginTop: 2,
  },
  activityDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginLeft: 48 + spacing.md,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  bookBtnText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '600',
  },
  tipsSection: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tipsTitle: {
    ...typography.titleSm,
    marginBottom: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipBullet: {
    ...typography.bodyMd,
    color: colors.warning,
  },
  tipText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.outline,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  shareBtnDisabled: {
    opacity: 0.5,
  },
  shareBtnText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
})
