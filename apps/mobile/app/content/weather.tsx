import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import { contentApi } from '../../src/lib/api'

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  storm: '⛈️',
  partly_cloudy: '⛅',
  night: '🌙',
}

function getWeatherIcon(condition: string | undefined): string {
  const c = (condition ?? '').toLowerCase()
  if (c.includes('nắng') || c.includes('sunny')) return WEATHER_ICONS.sunny ?? '☀️'
  if (c.includes('mưa') || c.includes('rain')) return WEATHER_ICONS.rain ?? '🌧️'
  if (c.includes('bão') || c.includes('storm')) return WEATHER_ICONS.storm ?? '⛈️'
  if (c.includes('âm') || c.includes('night')) return WEATHER_ICONS.night ?? '🌙'
  if (c.includes('nhiều mây') || c.includes('cloudy')) return WEATHER_ICONS.cloudy ?? '☁️'
  return WEATHER_ICONS.partly_cloudy ?? '⛅'
}

export default function WeatherScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['weather'],
    queryFn: () => contentApi.weather(),
  })

  const weather = data?.weather

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !weather) {
    return <ErrorState onRetry={refetch} />
  }

  const forecast = weather.forecast ?? []
  const icon = getWeatherIcon(weather.condition ?? '')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current */}
      <View style={styles.currentCard}>
        <Text style={styles.city}>Sầm Sơn, Thanh Hóa</Text>
        <View style={styles.currentMain}>
          <Text style={styles.currentIcon}>{icon}</Text>
          <View>
            <Text style={styles.currentTemp}>{weather.temperature ?? '—'}°C</Text>
            <Text style={styles.currentCondition}>{weather.condition ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.currentStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Độ ẩm</Text>
            <Text style={styles.statValue}>{weather.humidity ?? '—'}%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Gió</Text>
            <Text style={styles.statValue}>{weather.wind_speed ?? '—'} km/h</Text>
          </View>
        </View>
      </View>

      {/* Forecast */}
      {forecast.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dự báo 5 ngày</Text>
          <View style={styles.forecastList}>
            {forecast.map((day: any, i: number) => (
              <View key={i} style={styles.forecastDay}>
                <Text style={styles.forecastDayLabel}>
                  {day.day ??
                    new Date().toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                </Text>
                <Text style={styles.forecastIcon}>{getWeatherIcon(day.condition ?? '')}</Text>
                <Text style={styles.forecastHigh}>{day.high ?? '—'}°</Text>
                <Text style={styles.forecastLow}>{day.low ?? '—'}°</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>Dữ liệu thời tiết chỉ mang tính chất tham khảo.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.base, paddingBottom: spacing.xl },
  currentCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  city: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.md },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  currentIcon: { fontSize: 72 },
  currentTemp: { fontSize: 48, fontWeight: '700', color: colors.white },
  currentCondition: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)' },
  currentStats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { ...typography.bodySm, color: 'rgba(255,255,255,0.6)' },
  statValue: { ...typography.titleMd, color: colors.white, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.md },
  forecastList: { gap: spacing.sm },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  forecastDayLabel: { flex: 1, ...typography.bodyMd },
  forecastIcon: { fontSize: 22 },
  forecastHigh: { ...typography.titleMd, minWidth: 40, textAlign: 'right' },
  forecastLow: { ...typography.bodySm, color: colors.outline, minWidth: 40, textAlign: 'right' },
  disclaimer: {
    ...typography.labelSm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
