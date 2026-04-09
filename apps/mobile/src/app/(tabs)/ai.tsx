/**
 * AI Itinerary Screen — placeholder form for Phase 6.
 * Full AI integration comes in Phase 6 (AI Itinerary Generator).
 */
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'

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

export default function AiScreen() {
  const [days, setDays] = useState(2)
  const [budget, setBudget] = useState(0)
  const [type, setType] = useState('relax')

  async function handleGenerate() {
    Alert.alert(
      'Sắp ra mắt! 🤖',
      'Tính năng lịch trình AI sẽ có mặt ở Phase 6. Cảm ơn bạn đã chờ đợi!',
      [{ text: 'OK' }],
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lịch trình AI</Text>
          <Text style={styles.subtitle}>
            Để AI tạo lịch trình du lịch hoàn hảo cho bạn tại Sầm Sơn
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🤖</Text>
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

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={handleGenerate} activeOpacity={0.75}>
          <Text style={styles.ctaText}>Tạo lịch trình ✨</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          * Tính năng AI sẽ hoạt động từ Phase 6 — kết nối API Gemini/Claude
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
  title: { ...typography.headlineMd },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  hero: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.md },
  heroTitle: {
    ...typography.titleLg,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
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
  },
  chipActive: {
    backgroundColor: colors.primary,
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
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    ...typography.bodySm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
})
