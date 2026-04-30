import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'
import ErrorState from '../../src/components/error-state'
import type { WeatherData } from '../../src/lib/api'
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
  const beach = weather.beach

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current */}
      <View style={styles.currentCard}>
        <Text style={styles.city}>{weather.location?.name ?? 'Sầm Sơn, Thanh Hóa'}</Text>
        <View style={styles.currentMain}>
          <Text style={styles.currentIcon}>{icon}</Text>
          <View>
            <Text style={styles.currentTemp}>{weather.temperature ?? '—'}°C</Text>
            <Text style={styles.currentCondition}>{weather.condition ?? '—'}</Text>
            {weather.apparent_temperature != null && (
              <Text style={styles.currentMeta}>Cảm giác như {weather.apparent_temperature}°C</Text>
            )}
          </View>
        </View>
        <View style={styles.currentStats}>
          <WeatherStat label="Độ ẩm" value={`${weather.humidity ?? '—'}%`} />
          <View style={styles.statDivider} />
          <WeatherStat label="Gió" value={`${weather.wind_speed ?? '—'} km/h`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cho chuyến đi</Text>
        <View style={styles.infoGrid}>
          <InfoTile
            label="UV cao nhất"
            value={formatNumber(weather.uv_index)}
            helper="Chống nắng"
          />
          <InfoTile
            label="Khả năng mưa"
            value={formatPercent(weather.rain_probability)}
            helper={`${weather.precipitation ?? 0} mm hiện tại`}
          />
          <InfoTile
            label="Gió giật"
            value={`${weather.wind_gusts ?? '—'} km/h`}
            helper={weather.wind_direction != null ? `${weather.wind_direction}°` : 'Hướng gió'}
          />
          <InfoTile
            label="Mây phủ"
            value={formatPercent(weather.cloud_cover)}
            helper="Quan sát bầu trời"
          />
        </View>
      </View>

      {beach && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biển Sầm Sơn</Text>
          <View style={styles.beachCard}>
            <View style={styles.beachHead}>
              <Text style={styles.beachLabel}>Điều kiện tắm biển</Text>
              <Text style={styles.beachBadge}>{beach.safety_label ?? 'Đang cập nhật'}</Text>
            </View>
            <View style={styles.beachStats}>
              <WeatherStat label="Sóng" value={`${beach.wave_height ?? '—'} m`} />
              <WeatherStat label="Nước biển" value={`${beach.sea_surface_temperature ?? '—'}°C`} />
              <WeatherStat label="Chu kỳ sóng" value={`${beach.wave_period ?? '—'} s`} />
            </View>
            <Text style={styles.tipText}>{beach.safety_tip}</Text>
          </View>
        </View>
      )}

      {weather.travel_tip && (
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Gợi ý nhanh</Text>
          <Text style={styles.tipText}>{weather.travel_tip}</Text>
        </View>
      )}

      {/* Forecast */}
      {forecast.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dự báo 7 ngày</Text>
          <View style={styles.forecastList}>
            {forecast.map((day: NonNullable<WeatherData['forecast']>[number]) => (
              <View key={`${day.day ?? 'forecast'}-${day.condition}`} style={styles.forecastDay}>
                <Text style={styles.forecastDayLabel}>
                  {day.day ??
                    new Date().toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                </Text>
                <Text style={styles.forecastIcon}>{getWeatherIcon(day.condition ?? '')}</Text>
                <View style={styles.forecastDetails}>
                  <Text style={styles.forecastCondition} numberOfLines={1}>
                    {day.condition}
                  </Text>
                  <Text style={styles.forecastMeta}>
                    Mưa {formatPercent(day.rain_probability)} · UV {formatNumber(day.uv_index)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.forecastHigh}>{day.high ?? '—'}°</Text>
                  <Text style={styles.forecastLow}>{day.low ?? '—'}°</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>Dữ liệu thời tiết chỉ mang tính chất tham khảo.</Text>
    </ScrollView>
  )
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function InfoTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoHelper}>{helper}</Text>
    </View>
  )
}

function formatPercent(value: number | undefined) {
  return value == null ? '—' : `${value}%`
}

function formatNumber(value: number | undefined) {
  return value == null ? '—' : String(value)
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
  currentMeta: { ...typography.bodySm, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  currentStats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { ...typography.bodySm, color: 'rgba(255,255,255,0.6)' },
  statValue: { ...typography.titleMd, color: colors.white, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.titleLg, marginBottom: spacing.md },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoTile: {
    width: '48%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: spacing.base,
  },
  infoLabel: { ...typography.labelSm, color: colors.outline, marginBottom: 4 },
  infoValue: { ...typography.titleMd, color: colors.onSurface },
  infoHelper: { ...typography.bodySm, color: colors.outline, marginTop: 2 },
  beachCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 18,
    padding: spacing.base,
    gap: spacing.md,
  },
  beachHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  beachLabel: { ...typography.labelMd, color: 'rgba(255,255,255,0.72)' },
  beachBadge: { ...typography.labelMd, color: colors.white, fontWeight: '800' },
  beachStats: { flexDirection: 'row', gap: spacing.sm },
  tipCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  tipTitle: { ...typography.titleMd, color: colors.onSurface, marginBottom: 4 },
  tipText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
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
  forecastDetails: { flex: 1.3 },
  forecastCondition: { ...typography.labelMd, color: colors.onSurface },
  forecastMeta: { ...typography.labelSm, color: colors.outline, marginTop: 2 },
  forecastHigh: { ...typography.titleMd, minWidth: 40, textAlign: 'right' },
  forecastLow: { ...typography.bodySm, color: colors.outline, minWidth: 40, textAlign: 'right' },
  disclaimer: {
    ...typography.labelSm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
