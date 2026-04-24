import { useMutation } from '@tanstack/react-query'
/**
 * AI Itinerary Screen — form → POST /api/v1/itinerary → results
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import type { ItineraryResult } from '../../src/lib/api'
import { itineraryApi } from '../../src/lib/api'

const GROUP_TYPES = [
  { value: 'couple', label: 'Cặp đôi 💑' },
  { value: 'family', label: 'Gia đình 👨‍👩‍👧' },
  { value: 'friends', label: 'Bạn bè 👯' },
  { value: 'solo', label: 'Một mình 🎒' },
]

const PREFERENCES = [
  { value: 'biển', label: '🏖️ Biển' },
  { value: 'ẩm thực', label: '🍜 Ẩm thực' },
  { value: 'spa-massage', label: '💆 Spa & Massage' },
  { value: 'mua-sam', label: '🛍️ Mua sắm' },
  { value: 'giai-tri', label: '🎠 Giải trí' },
  { value: 'xe-dien', label: '🛺 Xe điện' },
]

const BUDGET_RANGES = [
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
  { value: 2000000, label: '2M' },
  { value: 5000000, label: '5M' },
]

export default function ItineraryScreen() {
  const [days, setDays] = useState(2)
  const [budget, setBudget] = useState(2000000)
  const [groupType, setGroupType] = useState('couple')
  const [prefs, setPrefs] = useState<string[]>(['biển', 'ẩm thực'])

  const mutation = useMutation({
    mutationFn: () =>
      itineraryApi.generate({ days, budget, preferences: prefs, group_type: groupType }),
    onSuccess: (res) => {
      const itinerary = res?.itinerary
      if (itinerary) {
        // Navigate to results screen or expand inline
        setResult(itinerary)
      }
    },
  })

  const [result, setResult] = useState<ItineraryResult | null>(null)

  function togglePref(val: string) {
    setPrefs((p) => (p.includes(val) ? p.filter((x) => x !== val) : [...p, val]))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🤖</Text>
          <Text style={styles.heroTitle}>Lịch trình AI</Text>
          <Text style={styles.heroSub}>
            Để AI S-Loco thiết kế hành trình hoàn hảo cho bạn tại Sầm Sơn
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Days */}
          <View style={styles.field}>
            <Text style={styles.label}>Số ngày</Text>
            <View style={styles.stepperRow}>
              {[1, 2, 3, 4, 5].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.stepper, days === d && styles.stepperActive]}
                  onPress={() => setDays(d)}
                >
                  <Text style={[styles.stepperText, days === d && styles.stepperTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget */}
          <View style={styles.field}>
            <Text style={styles.label}>Ngân sách</Text>
            <View style={styles.budgetRow}>
              {BUDGET_RANGES.map((b) => (
                <TouchableOpacity
                  key={b.value}
                  style={[styles.budgetChip, budget === b.value && styles.budgetChipActive]}
                  onPress={() => setBudget(b.value)}
                >
                  <Text style={[styles.budgetText, budget === b.value && styles.budgetTextActive]}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Group Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Đi cùng</Text>
            <View style={styles.groupRow}>
              {GROUP_TYPES.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.groupChip, groupType === g.value && styles.groupChipActive]}
                  onPress={() => setGroupType(g.value)}
                >
                  <Text style={[styles.groupText, groupType === g.value && styles.groupTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.field}>
            <Text style={styles.label}>Sở thích</Text>
            <View style={styles.prefGrid}>
              {PREFERENCES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.prefChip, prefs.includes(p.value) && styles.prefChipActive]}
                  onPress={() => togglePref(p.value)}
                >
                  <Text style={[styles.prefText, prefs.includes(p.value) && styles.prefTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, mutation.isPending && styles.ctaBtnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaBtnText}>Tạo lịch trình ✨</Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {mutation.isError && <Text style={styles.errorText}>Đã xảy ra lỗi. Vui lòng thử lại.</Text>}

        {/* Results */}
        {result && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Lịch trình của bạn</Text>
            {result.days?.map((day) => (
              <View key={`day-${day.day}`} style={styles.dayCard}>
                <Text style={styles.dayTitle}>Ngày {day.day}</Text>
                {day.activities?.map((act) => (
                  <View key={`${day.day}-${act.time}-${act.title}`} style={styles.activityRow}>
                    <Text style={styles.activityTime}>{act.time}</Text>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      {act.location && (
                        <Text style={styles.activityLocation}>📍 {act.location}</Text>
                      )}
                      {act.estimated_cost != null && (
                        <Text style={styles.activityCost}>
                          ~{act.estimated_cost.toLocaleString('vi-VN')}₫
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {result.total_estimated_cost != null && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng ước tính</Text>
                <Text style={styles.totalAmount}>
                  {result.total_estimated_cost.toLocaleString('vi-VN')}₫
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: spacing.lg,
  },
  heroEmoji: { fontSize: 56, marginBottom: spacing.md },
  heroTitle: { ...typography.headlineMd, color: colors.white, marginBottom: spacing.sm },
  heroSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  form: { paddingHorizontal: spacing.base, gap: spacing.lg, marginBottom: spacing.lg },
  field: { gap: spacing.sm },
  label: { ...typography.labelLg, color: colors.onSurface },
  stepperRow: { flexDirection: 'row', gap: spacing.sm },
  stepper: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperActive: { backgroundColor: colors.primaryContainer },
  stepperText: { ...typography.titleMd, color: colors.onSurfaceVariant },
  stepperTextActive: { color: colors.white },
  budgetRow: { flexDirection: 'row', gap: spacing.sm },
  budgetChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetChipActive: { backgroundColor: colors.primaryContainer },
  budgetText: { ...typography.titleSm, color: colors.onSurfaceVariant },
  budgetTextActive: { color: colors.white },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainer,
  },
  groupChipActive: { backgroundColor: colors.primaryContainer },
  groupText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  groupTextActive: { color: colors.white, fontWeight: '600' },
  prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prefChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: colors.secondaryContainer,
  },
  prefChipActive: { backgroundColor: colors.primary },
  prefText: { ...typography.bodySm, color: colors.onSecondaryContainer },
  prefTextActive: { color: colors.white, fontWeight: '600' },
  ctaBtn: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(22, 27, 46, 0.12)' },
      default: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
      },
    }),
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  results: { paddingHorizontal: spacing.base, marginTop: spacing.lg },
  resultsTitle: { ...typography.headlineMd, marginBottom: spacing.md },
  dayCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  dayTitle: { ...typography.titleMd, marginBottom: spacing.md, color: colors.primary },
  activityRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  activityTime: { ...typography.labelMd, color: colors.outline, minWidth: 48 },
  activityInfo: { flex: 1 },
  activityTitle: { ...typography.bodyMd },
  activityLocation: { ...typography.bodySm, color: colors.outline, marginTop: 2 },
  activityCost: { ...typography.labelSm, color: colors.primary, marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  totalLabel: { ...typography.titleMd, color: colors.white },
  totalAmount: { ...typography.headlineMd, color: colors.white },
})
